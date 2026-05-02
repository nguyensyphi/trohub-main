param(
    [string]$SourcePath = "C:\Users\LENOVO\Downloads\ĐỒ ÁN\trohub\ReportThesis_NSPhi_final_ver_1.docx",
    [string]$OutputPath = "C:\Users\LENOVO\Downloads\ĐỒ ÁN\trohub\ReportThesis_NSPhi_final_ver_1_formatted.docx"
)

$ErrorActionPreference = "Stop"

function Get-ParaText {
    param($Paragraph)
    return $Paragraph.Range.Text.TrimEnd([char]13, [char]7).Trim()
}

function Set-ParaText {
    param($Paragraph, [string]$Text)
    $current = Get-ParaText $Paragraph
    if ($current -ne $Text) {
        $Paragraph.Range.Text = if ([string]::IsNullOrEmpty($Text)) { "`r" } else { $Text + "`r" }
    }
}

function Normalize-Text {
    param([string]$Text)

    $t = $Text
    $t = $t -replace '^\s*#{1,6}\s*', ''
    $t = $t -replace '\*\*', ''
    $t = $t -replace '^\s*\*\s+', '• '
    $t = $t -replace '^\s*\s*', '• '
    $t = $t -replace '[―‖]', '"'
    $t = $t -replace 'MOMO', 'MoMo'
    $t = $t -replace 'Password recover', 'Password recovery'
    $t = $t -replace 'Sent Email', 'Send Email'
    $t = $t -replace '\s+,', ','
    $t = $t -replace '\s+\.', '.'
    $t = $t -replace '\s+;', ';'
    $t = $t -replace '\s+:', ':'
    $t = $t -replace 'the degree of\s+Bachelor', 'the degree of Bachelor'
    $t = $t -replace ' {2,}', ' '
    $t = $t.Trim()
    $t = $t -replace '(?<!\.)\.\.(?!\.)', '.'

    switch -Regex ($t) {
        '^CHAPTER 4\. IMPLEMENTS AND RESULTS$' { return 'CHAPTER 4. IMPLEMENTATION AND RESULTS' }
        '^4\.1\. Implement$' { return '4.1. Implementation' }
        '^4\.2\. Result$' { return '4.2. Results' }
        '^2\.3\. Summarize$' { return '2.3. Summary' }
        '^2\.3\.1\. Login and Forgot Password$' { return '4.2.1.7. Login and Forgot Password' }
        '^4\.2\.3\.2\.$' { return '' }
        '^Figure 16: Database diagram number 8 Users$' { return 'Figure 16: Database diagram number 9 Users' }
        '^Figure 61: MoMo top-up$' { return 'Figure 61: MoMo top-up' }
        '^Figure 62: MoMo gateway$' { return 'Figure 62: MoMo gateway' }
        '^APPROVED BY:\s*_+\s*,$' { return 'APPROVED BY: ________________________________' }
        default { return $t }
    }
}

function Get-HeadingStyle {
    param([string]$Text)

    $frontMatter = @(
        'ACKNOWLEDGMENTS',
        'LIST OF FIGURES',
        'LIST OF TABLES',
        'ABSTRACT',
        'REFERENCES'
    )

    if ($frontMatter -contains $Text) {
        return 'Heading 1'
    }

    if ($Text -match '^CHAPTER\s+\d+\.\s+\S') {
        return 'Heading 1'
    }

    if ($Text -match '^UC-\d+:\s+\S') {
        return 'Heading 4'
    }

    if ($Text -match '^(?<nums>\d+(?:\.\d+)+\.)\s+\S') {
        $depth = ($Matches.nums.TrimEnd('.').Split('.')).Count
        switch ($depth) {
            2 { return 'Heading 2' }
            3 { return 'Heading 3' }
            4 { return 'Heading 4' }
            5 { return 'Heading 5' }
            6 { return 'Heading 6' }
            7 { return 'Heading 7' }
            8 { return 'Heading 8' }
            default { return 'Heading 9' }
        }
    }

    return $null
}

function Find-ParagraphIndex {
    param($Document, [string]$ExactText)
    for ($i = 1; $i -le $Document.Paragraphs.Count; $i++) {
        if ((Get-ParaText $Document.Paragraphs.Item($i)) -eq $ExactText) {
            return $i
        }
    }
    return $null
}

function Replace-RangeWithEntries {
    param(
        $Document,
        [int]$HeadingStartIndex,
        [int]$NextHeadingIndex,
        [System.Collections.Generic.List[string]]$Entries
    )

    $start = $Document.Paragraphs.Item($HeadingStartIndex).Range.End
    $end = $Document.Paragraphs.Item($NextHeadingIndex).Range.Start - 1
    if ($end -lt $start) {
        return
    }

    $textBlock = if ($Entries.Count -gt 0) { ($Entries -join "`r") + "`r" } else { "`r" }
    $range = $Document.Range($start, $end)
    $range.Text = $textBlock

    $newRange = $Document.Range($start, $start + $textBlock.Length)
    foreach ($para in $newRange.Paragraphs) {
        $txt = Get-ParaText $para
        if ([string]::IsNullOrWhiteSpace($txt)) {
            continue
        }
        $para.Range.Style = "Normal"
        $para.Range.ParagraphFormat.TabStops.ClearAll()
        [void]$para.Range.ParagraphFormat.TabStops.Add(450, 2, 1)
        $para.Range.ParagraphFormat.SpaceAfter = 0
        $para.Range.ParagraphFormat.SpaceBefore = 0
        $para.Range.ParagraphFormat.Alignment = 0
    }
}

if ((Resolve-Path -LiteralPath $SourcePath).Path -ne (Resolve-Path -LiteralPath $OutputPath -ErrorAction SilentlyContinue | ForEach-Object Path)) {
    try {
        Copy-Item -LiteralPath $SourcePath -Destination $OutputPath -Force
    }
    catch {
        if (-not (Test-Path -LiteralPath $OutputPath)) {
            throw
        }
    }
}

$word = $null
$doc = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $doc = $word.Documents.Open($OutputPath)

    $lofIndex = Find-ParagraphIndex $doc 'LIST OF FIGURES'
    $lotIndex = Find-ParagraphIndex $doc 'LIST OF TABLES'
    $abstractIndex = Find-ParagraphIndex $doc 'ABSTRACT'

    $deleteIndices = New-Object System.Collections.Generic.List[int]

    for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
        $para = $doc.Paragraphs.Item($i)
        $styleName = [string]$para.Range.Style
        $text = Get-ParaText $para

        if ([string]::IsNullOrWhiteSpace($text)) {
            continue
        }

        if ($styleName -like 'TOC*') {
            continue
        }

        $isListOfFiguresBody = $lofIndex -and $lotIndex -and $i -gt $lofIndex -and $i -lt $lotIndex
        $isListOfTablesBody = $lotIndex -and $abstractIndex -and $i -gt $lotIndex -and $i -lt $abstractIndex
        if ($isListOfFiguresBody -or $isListOfTablesBody) {
            continue
        }

        $normalized = Normalize-Text $text

        if ([string]::IsNullOrWhiteSpace($normalized)) {
            $deleteIndices.Add($i)
            continue
        }

        Set-ParaText $para $normalized

        $headingStyle = Get-HeadingStyle $normalized
        $isCaption = $normalized -match '^(Figure|Table)\s+\d+:\s+\S'

        if ($isCaption) {
            $para.Range.Style = "Normal"
            $para.Range.ParagraphFormat.Alignment = 1
            $para.Range.ParagraphFormat.SpaceBefore = 0
            $para.Range.ParagraphFormat.SpaceAfter = 6
            continue
        }

        if ($headingStyle) {
            $para.Range.Style = $headingStyle
            $para.Range.ParagraphFormat.Alignment = 0
            continue
        }

        if ($styleName -match '^Heading [1-9]$') {
            $para.Range.Style = "Normal"
        }
    }

    for ($idx = $deleteIndices.Count - 1; $idx -ge 0; $idx--) {
        $doc.Paragraphs.Item($deleteIndices[$idx]).Range.Delete()
    }

    foreach ($toc in $doc.TablesOfContents) {
        $toc.Update()
    }

    $doc.Fields.Update() | Out-Null
    $doc.Repaginate()

    for ($pass = 1; $pass -le 2; $pass++) {
        $lofIndex = Find-ParagraphIndex $doc 'LIST OF FIGURES'
        $lotIndex = Find-ParagraphIndex $doc 'LIST OF TABLES'
        $abstractIndex = Find-ParagraphIndex $doc 'ABSTRACT'

        $figureEntries = New-Object 'System.Collections.Generic.List[string]'
        $tableEntries = New-Object 'System.Collections.Generic.List[string]'

        for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
            $para = $doc.Paragraphs.Item($i)
            $text = Get-ParaText $para
            if ([string]::IsNullOrWhiteSpace($text)) {
                continue
            }
            if ($abstractIndex -and $i -lt $abstractIndex) {
                continue
            }

            if ($text -match '^Figure\s+\d+:\s+\S') {
                $page = $para.Range.Information(3)
                $figureEntries.Add("$text`t$page")
                continue
            }

            if ($text -match '^Table\s+\d+:\s+\S') {
                $page = $para.Range.Information(3)
                $tableEntries.Add("$text`t$page")
            }
        }

        Replace-RangeWithEntries -Document $doc -HeadingStartIndex $lofIndex -NextHeadingIndex $lotIndex -Entries $figureEntries
        Replace-RangeWithEntries -Document $doc -HeadingStartIndex $lotIndex -NextHeadingIndex $abstractIndex -Entries $tableEntries

        foreach ($toc in $doc.TablesOfContents) {
            $toc.Update()
        }
        $doc.Fields.Update() | Out-Null
        $doc.Repaginate()
    }

    $doc.Save()
}
finally {
    if ($doc -ne $null) {
        $doc.Close()
    }
    if ($word -ne $null) {
        $word.Quit()
    }
}
