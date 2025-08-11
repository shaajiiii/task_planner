import Calendar from "@/components/Calender";
import CalendarSearchFilterBar from "@/components/SearchAndFilter";
import { CalendarProvider } from "@/context/CalendarContext";

export const Home = () => {
  return (
    <div>
      <CalendarProvider>
        <CalendarSearchFilterBar />
        <Calendar />
      </CalendarProvider>
    </div>
  );
};
