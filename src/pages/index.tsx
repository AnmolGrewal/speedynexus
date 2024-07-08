import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, ThemeProvider, createTheme, Typography, Box } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DateCalendar, DatePicker } from '@mui/x-date-pickers';
import NexusLocation, { locations } from '../data/Locations';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

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

  const fetchTimeSlots = async (locationId: number) => {
    try {
      const response = await fetch(`https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=9999999&locationId=${locationId}&minimum=1`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      setTimeSlots(data);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const availableSlots = timeSlots.filter(slot => 
    (!fromDate || dayjs(slot.startTimestamp).isSameOrAfter(fromDate, 'day')) &&
    (!toDate || dayjs(slot.startTimestamp).isSameOrBefore(toDate, 'day'))
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <Box className="p-4" display="flex" flexDirection="column" alignItems="center">
      <Typography variant="h3" align="center" gutterBottom>
      Nexus Interview Availability
    </Typography>
        <Autocomplete
          options={locations}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => <TextField {...params} label="Select Location" />}
          onChange={(_, newValue) => setSelectedLocation(newValue)}
          sx={{ width: 415, marginBottom: 2 }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box display="flex" justifyContent="center" mb={2}>
            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              sx={{ width: 200, marginRight: 2 }}
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              sx={{ width: 200 }}
            />
          </Box>
          {selectedLocation && (
            availableSlots.length > 0 ? (
              <Box>
                <Typography variant="h5" align="center" gutterBottom>
                  {selectedDate?.format('MMMM D, YYYY')}
                </Typography>
                <DateCalendar
                  sx={{ width: 400, height: 400 }}
                  minDate={fromDate || dayjs().startOf('day')}
                  maxDate={toDate || dayjs().add(1, 'year').endOf('day')}
                  shouldDisableDate={(date) => {
                    return !availableSlots.some(slot => dayjs(slot.startTimestamp).isSame(date, 'day'));
                  }}
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                />
                <Box mt={2}>
                  <Typography variant="h6" align="center" gutterBottom>
                    Available Times
                  </Typography>
                  <ul style={{ listStyle: 'none', padding: 0, textAlign: 'center' }}>
                    {availableSlots
                      .filter(slot => dayjs(slot.startTimestamp).isSame(selectedDate, 'day'))
                      .map(slot => (
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
            )
          )}
        </LocalizationProvider>
      </Box>
    </ThemeProvider>
  );
}