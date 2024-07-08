import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, ThemeProvider, createTheme } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { locations } from '../data/Locations';

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
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (selectedLocation) {
      fetchTimeSlots(selectedLocation.id);
    }
  }, [selectedLocation]);

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

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="p-4">
        <Autocomplete
          options={locations}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => <TextField {...params} label="Select Location" />}
          onChange={(_, newValue) => setSelectedLocation(newValue)}
        />
        {selectedLocation && (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar
              renderDay={(day, _, dayComponentProps) => {
                const hasSlots = timeSlots.some(slot => new Date(slot.startTimestamp).toDateString() === day.toDateString());
                return (
                  <div
                    {...dayComponentProps}
                    style={{
                      ...dayComponentProps.style,
                      backgroundColor: hasSlots ? 'rgba(0, 255, 0, 0.2)' : undefined,
                    }}
                  >
                    {day.getDate()}
                  </div>
                );
              }}
            />
          </LocalizationProvider>
        )}
      </div>
    </ThemeProvider>
  );
}