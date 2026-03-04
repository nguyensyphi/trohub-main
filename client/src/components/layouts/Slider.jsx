import PropTypes from "prop-types"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel"

const Slider = ({ media = [] }) => {
  return (
    <div className="w-full flex bg-black items-center justify-center border border-input">
      <Carousel className="w-3/5">
        <CarouselContent className="w-[calc(100%+16px)] pl-0">
          {media.map((el, idx) => (
            <CarouselItem className="h-full pl-0 m-auto" key={idx}>
              <img src={el} alt="Slider Image" className="h-[350px] w-full object-cover" />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}

export default Slider
Slider.propTypes = {
  media: PropTypes.arrayOf(PropTypes.string).isRequired,
}
