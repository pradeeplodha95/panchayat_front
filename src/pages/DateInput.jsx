import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Input,
  InputGroup,
  InputRightElement,
  Icon,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { AiOutlineCalendar } from "react-icons/ai";

const ChakraInput = forwardRef(({ value, onClick, onChange }, ref) => (
  <Input
    ref={ref}
    value={value}
    onClick={onClick}
    onChange={onChange}
    placeholder="DD/MM/YYYY"
    size="lg"
    bg="gray.100"
w={{
  base: "100%",    // Mobile (0 - 480px)
  sm: "120%",      // Small mobile/tablet-480px -
  md: "650px",     // Tablet-768px
  lg: "780px",     // Laptop-992px
  xl: "780px",     // Desktop-1280px
  "2xl": "820px",  // Big screens
}}

            // ✅ Responsive width
  />
));

const DateInput = ({
  label,
  formValue,        // case 1: formValue + setFormValue
  setFormValue,

  value,            // case 2: value + name + onDateChange
  name,
  onDateChange,

  formatDisplayDate,
  convertToISO,
  t,
}) => {

  // 🟢 Universal GET function
  const getValue = () => {
    if (formValue) return formValue.dateDisplay || "";
    return value || "";
  };

  // 🟢 Universal SET function
  const updateValue = (displayDate, isoDate) => {
    if (formValue && setFormValue) {
      setFormValue((prev) => ({
        ...prev,
        dateDisplay: displayDate,
        date: isoDate,
      }));
      }

    if (onDateChange && name) {
      onDateChange(name, displayDate);
    }
  };

  const selectedDate = (() => {
    const val = formValue ? formValue.date : value;
    return val && !isNaN(new Date(val).getTime()) ? new Date(val) : null;
  })();

  return (
    <FormControl isRequired w="100%">
      <FormLabel fontWeight="600">{label || t("date")}</FormLabel>

      <InputGroup w="100%">
        <DatePicker
       selected={selectedDate}
          value={getValue()}

                  onChange={(date) => {
            if (!date) return;

            const dd = String(date.getDate()).padStart(2, "0");
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const yyyy = date.getFullYear();

            const display = `${dd}/${mm}/${yyyy}`;
            const iso = `${yyyy}-${mm}-${dd}`;

            updateValue(display, iso);
          }}



           
         onChangeRaw={(e) => {
            const raw = e.target.value || "";

            if (raw.trim() === "") {
              updateValue("", "");
              return;
            }

            const display = formatDisplayDate(raw);
            const iso = convertToISO(display);

            updateValue(display, iso);
          }}
          dateFormat="dd/MM/yyyy"
          customInput={<ChakraInput />}
          popperPlacement="bottom-start"
          portalId="root-portal"
        />

        <InputRightElement pointerEvents="none">
          <Icon as={AiOutlineCalendar} color="gray.500" boxSize={5} />
        </InputRightElement>
      </InputGroup>
    </FormControl>
  );
};

export default DateInput;
