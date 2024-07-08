import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  ThemeProvider,
  createTheme,
  Typography,
  Box,
  IconButton,
  Checkbox,
  FormControlLabel,
  Button,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DateCalendar, DatePicker } from '@mui/x-date-pickers';
import NexusLocation, { locations } from '../data/Locations';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

interface TimeSlot {
  locationId: number;
  startTimestamp: string;
  endTimestamp: string;
  active: boolean;
  duration: number;
  remoteInd: boolean;
}

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<NexusLocation | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [checkEveryMinute, setCheckEveryMinute] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const minDate = dayjs().startOf('day');
  const maxDate = dayjs().add(1, 'year').endOf('day');

  useEffect(() => {
    const storedLocation = localStorage.getItem('selectedLocation');
    const storedFromDate = localStorage.getItem('fromDate');
    const storedToDate = localStorage.getItem('toDate');
    const storedCheckEveryMinute = localStorage.getItem('checkEveryMinute');

    if (storedLocation) setSelectedLocation(JSON.parse(storedLocation));
    if (storedFromDate) setFromDate(dayjs(storedFromDate));
    if (storedToDate) setToDate(dayjs(storedToDate));
    if (storedCheckEveryMinute) setCheckEveryMinute(JSON.parse(storedCheckEveryMinute));
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchTimeSlots(selectedLocation.id);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (timeSlots.length > 0) {
      const firstAvailableDate = dayjs(timeSlots[0].startTimestamp);
      setSelectedDate(firstAvailableDate);
    } else {
      setSelectedDate(null);
    }
  }, [timeSlots]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (checkEveryMinute && selectedLocation) {
      interval = setInterval(() => {
        fetchTimeSlots(selectedLocation.id);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [checkEveryMinute, selectedLocation]);

  const fetchTimeSlots = async (locationId: number) => {
    try {
      const response = await fetch(
        `https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=9999999&locationId=${locationId}&minimum=1`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );
      const data = await response.json();
      setTimeSlots(data);
      checkAndNotify(data);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const checkAndNotify = (slots: TimeSlot[]) => {
    if (!checkEveryMinute) return;

    const availableSlots = slots.filter(
      (slot) =>
        (!fromDate || dayjs(slot.startTimestamp).isSameOrAfter(fromDate, 'day')) &&
        (!toDate || dayjs(slot.startTimestamp).isSameOrBefore(toDate, 'day'))
    );

    if (availableSlots.length > 0) {
      if ('Notification' in window) {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Nexus Interview Slots Available', {
              body: 'New interview slots are available in your selected date range.',
            });
          }
        });
      }
    }
  };

  const handleLocationChange = (newValue: NexusLocation | null) => {
    setSelectedLocation(newValue);
    localStorage.setItem('selectedLocation', JSON.stringify(newValue));
  };

  const handleFromDateChange = (newValue: Dayjs | null) => {
    setFromDate(newValue);
    localStorage.setItem('fromDate', newValue ? newValue.toISOString() : '');
  };

  const handleToDateChange = (newValue: Dayjs | null) => {
    setToDate(newValue);
    localStorage.setItem('toDate', newValue ? newValue.toISOString() : '');
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckEveryMinute(event.target.checked);
    localStorage.setItem('checkEveryMinute', JSON.stringify(event.target.checked));
  };

  const handleRefresh = () => {
    const currentTime = Date.now();
    if (currentTime - lastRefreshTime < 15000) {
      alert('You must wait at least 15 seconds between refreshes.');
      return;
    }

    setIsRefreshing(true);
    setLastRefreshTime(currentTime);

    if (selectedLocation) {
      fetchTimeSlots(selectedLocation.id);
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 15000);
  };

  const availableSlots = timeSlots.filter(
    (slot) =>
      (!fromDate || dayjs(slot.startTimestamp).isSameOrAfter(fromDate, 'day')) &&
      (!toDate || dayjs(slot.startTimestamp).isSameOrBefore(toDate, 'day'))
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <Box className="p-4 flex flex-col items-center">
        <Typography variant="h3" align="center" gutterBottom>
          Nexus Interview Availability
        </Typography>
        <Autocomplete
          options={locations}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => <TextField {...params} label="Select Location" />}
          onChange={(_, newValue) => handleLocationChange(newValue)}
          className="w-[415px] mb-4"
          value={selectedLocation}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box className="flex justify-center mb-4">
            <Box className="relative mr-4">
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={handleFromDateChange}
                minDate={minDate}
                maxDate={maxDate}
                className="w-[200px]"
              />
              {fromDate && (
                <IconButton
                  size="small"
                  className="absolute right-10 top-1/2 transform -translate-y-1/2"
                  onClick={() => handleFromDateChange(null)}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Box className="relative">
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={handleToDateChange}
                minDate={minDate}
                maxDate={maxDate}
                className="w-[200px]"
              />
              {toDate && (
                <IconButton
                  size="small"
                  className="absolute right-10 top-1/2 transform -translate-y-1/2"
                  onClick={() => handleToDateChange(null)}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
          <FormControlLabel
            control={<Checkbox checked={checkEveryMinute} onChange={handleCheckboxChange} />}
            label="Check Every Minute and Send Notification if Available"
          />
          {selectedLocation &&
            (availableSlots.length > 0 ? (
              <Box>
                <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                  <Typography variant="h5" align="center">
                    {selectedDate?.format('MMMM D, YYYY')}
                  </Typography>
                  <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshIcon />
                  </IconButton>
                </Box>
                <DateCalendar
                  className="w-[400px] h-[400px]"
                  minDate={fromDate || minDate}
                  maxDate={toDate || maxDate}
                  shouldDisableDate={(date) => {
                    return !availableSlots.some((slot) => dayjs(slot.startTimestamp).isSame(date, 'day'));
                  }}
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                />
                <Box className="mt-4">
                  <Typography variant="h6" align="center" gutterBottom>
                    Available Times
                  </Typography>
                  <ul className="list-none p-0 text-center">
                    {availableSlots
                      .filter((slot) => dayjs(slot.startTimestamp).isSame(selectedDate, 'day'))
                      .map((slot) => (
                        <li key={slot.startTimestamp}>
                          {dayjs(slot.startTimestamp).format('h:mm A')} - {dayjs(slot.endTimestamp).format('h:mm A')}
                        </li>
                      ))}
                  </ul>
                </Box>
              </Box>
            ) : (
              <Typography variant="h4" align="center">
                No Dates Currently Available
              </Typography>
            ))}
        </LocalizationProvider>
      </Box>
    </ThemeProvider>
  );
}
