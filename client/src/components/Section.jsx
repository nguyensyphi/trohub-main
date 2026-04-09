import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import PropTypes from "prop-types"
import { memo } from "react"
import { useNavigate } from "react-router-dom"

const Section = ({ children, title, className, isBack = false, onBack }) => {
  const navigate = useNavigate()
  const handleOnBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }
  return (
    <div className={cn("rounded-xl mx-auto bg-card space-y-6 border border-border p-6 shadow-sm", className)}>
      <div className="flex items-center">
        {isBack && (
          <Button className="bg-transparent w-fit hover:bg-transparent text-foreground" onClick={handleOnBack}>
            <ArrowLeft />
          </Button>
        )}
        <h2 className="font-bold text-2xl">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default memo(Section)
Section.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  className: PropTypes.string,
  isBack: PropTypes.bool,
  onBack: PropTypes.func,
}
