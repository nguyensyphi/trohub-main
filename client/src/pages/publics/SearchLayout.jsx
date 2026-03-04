import { CustomAddressV2, List } from "@/components/layouts"
import { MapContainer } from "@/components/maps"
import PopoverCheckbox from "@/components/searchs/PopoverCheckbox"
import PopoverRange from "@/components/searchs/PopoverRange"
import { Input } from "@/components/ui/input"
import { convenients, genders, prices, sizes } from "@/lib/constant"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { apiGetLocationsFromSearchTerm } from "@/apis/external"
import { MapPinX } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { SelectValue } from "@radix-ui/react-select"
import { Label } from "@/components/ui/label"
import useDebounce from "@/hooks/useDebounce"

const SearchLayout = () => {
  const [locations, setLocations] = useState([])
  const [addressArr, setAddressArr] = useState([])
  const [searchParams] = useSearchParams()
  const [bedroom, setBedroom] = useState("")
  const [bathroom, setBathroom] = useState("")
  const [gender, setGender] = useState("")
  const [title, setTitle] = useState("")
  const navigate = useNavigate()
  const location = useLocation()

  const address = searchParams.get("address")
  const debounceTitle = useDebounce(title, 800)

  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString())

    if (gender) newSearchParams.set("gender", gender)
    else newSearchParams.delete(gender)

    if (debounceTitle) newSearchParams.set("title", debounceTitle)
    else newSearchParams.delete(title)

    if (bedroom) newSearchParams.set("bedroom", bedroom)
    else newSearchParams.delete(bedroom)

    if (bathroom) newSearchParams.set("bathroom", bathroom)
    else newSearchParams.delete(bathroom)

    navigate({
      pathname: location.pathname,
      search: newSearchParams.toString(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, bedroom, bathroom, searchParams, location.pathname, debounceTitle])

  useEffect(() => {
    const fetchLocations = async () => {
      const promise = addressArr.map((el) => apiGetLocationsFromSearchTerm(el))
      const response = await Promise.all(promise)
      let newLocations = []
      response.forEach((el) => {
        if (el.status === 200) {
          const dataFormat = el.data
            ?.filter((_, idx) => idx === 0)
            ?.map((i) => ({
              longitude: +i.lon,
              latitude: +i.lat,
              displayName: i.display_name,
            }))
          newLocations = [...newLocations, ...dataFormat]
        }
      })
      setLocations(newLocations)
    }
    if (addressArr && addressArr.length > 0) fetchLocations()
    else setLocations([])
  }, [addressArr])

  // console.log(form.getValues())

  return (
    <div className="h-full space-y-4 p-6">
      <h1 className="text-lg font-bold">{`Tìm kiếm ${address}`}</h1>
      <div className="h-fit grid grid-cols-5 gap-4">
        <PopoverRange
          id="price"
          label="Mức giá"
          _id="_price"
          maxValue={15 * Math.pow(10, 6)}
          options={prices}
          exp={1000000}
          unit="đ"
          className="text-primary text-sm h-8"
        />
        <PopoverRange
          id="size"
          label="Diện tích"
          _id="_size"
          unit="m²"
          maxValue={150}
          options={sizes}
          className="text-primary h-8"
        />
        <PopoverCheckbox
          className="text-primary text-sm h-8"
          options={convenients.map((el) => ({ id: el, label: el }))}
        />
        <div className="grid grid-cols-3 col-span-2 gap-4">
          <div className="flex items-center gap-2">
            <Label>Đối tượng:</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="h-8">
                <SelectValue className="placeholder:text-sm placeholder:text-slate-500" placeholder="Chọn" />
              </SelectTrigger>
              <SelectContent>
                {genders.map((el) => (
                  <SelectItem value={el.value} key={el.value}>
                    {el.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="min-w-[70px]">Số phòng ngủ</Label>
            <Input
              type="number"
              value={bedroom}
              onChange={(e) => setBedroom(e.target.value)}
              placeholder="0"
              className="h-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="min-w-[70px]">Số phòng tắm</Label>
            <Input
              type="number"
              value={bathroom}
              onChange={(e) => setBathroom(e.target.value)}
              placeholder="0"
              className="h-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="min-w-[50px]">Tựa đề</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Phòng trọ abc..."
            className="h-8"
          />
        </div>
        <CustomAddressV2 />
      </div>
      <div className={cn("h-[calc(100%-140px)] grid grid-cols-1", "grid-cols-2 gap-4 w-full")}>
        <div className={cn("max-h-full h-full overflow-y-auto")}>
          <List setAddressArr={setAddressArr} setLocations={setLocations} />
        </div>
        <div className="w-full bg-secondary rounded-md">
          {locations && locations.length > 0 ? (
            <div className="col-span-2 h-full">
              <MapContainer locations={locations} zoom={13} />
            </div>
          ) : (
            <p className="w-full h-full flex flex-col items-center justify-center gap-6 text-sm italic">
              <MapPinX size={96} color="gray" />
              <span>Không tìm thấy tọa độ bản đồ...</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchLayout
