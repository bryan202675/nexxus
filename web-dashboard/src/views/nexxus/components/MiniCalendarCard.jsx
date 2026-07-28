import { useState } from "react";
import Calendar from "react-calendar";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import "react-calendar/dist/Calendar.css";
import "assets/css/MiniCalendar.css";
import NexxusCard from "./NexxusCard";

// react-calendar's own dark-mode overrides (assets/css/MiniCalendar.css, `body.dark .react-calendar__*`)
// already use #7551ff for nav buttons / active day, so no extra dark styling is needed here.
const MiniCalendarCard = ({ delay = 0 }) => {
  const [value, onChange] = useState(new Date());

  return (
    <NexxusCard extra="flex w-full h-full flex-col px-3 py-3" delay={delay}>
      <Calendar
        onChange={onChange}
        value={value}
        prevLabel={<MdChevronLeft className="ml-1 h-6 w-6" />}
        nextLabel={<MdChevronRight className="ml-1 h-6 w-6" />}
        view="month"
      />
    </NexxusCard>
  );
};

export default MiniCalendarCard;
