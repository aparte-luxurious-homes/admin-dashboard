import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  startOfToday,
} from 'date-fns';
import { Paper, Typography, IconButton, Box, TextField, Drawer } from '@mui/material';
import Grid from '@mui/material/Grid2';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface DateInputProps {
  onClose?: () => void;
  onCheckInDateSelect: (date: Date | null) => void;
  onCheckOutDateSelect: (date: Date | null) => void;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  displayError?: (message: string) => void;
  width?: string;
  showTwoMonths?: boolean;
  availableDates?: { date: string }[];
  isMobileView?: boolean;
  style?: React.CSSProperties;
}

const DateInput: React.FC<DateInputProps> = ({
  onClose,
  onCheckInDateSelect,
  onCheckOutDateSelect,
  checkInDate,
  checkOutDate,
  displayError,
  width = '100%',
  showTwoMonths = true,
  availableDates = [],
  isMobileView = false,
}) => {
  const availableDateObjects = availableDates.map(
    (item) => new Date(item.date)
  );

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const today = startOfToday();
  
  const isDateDisabled = (date: Date) => {
    return isBefore(date, today) || 
           (availableDates.length > 0 && !availableDateObjects.some(
             (availableDate) => format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
           ));
  };

  const handleDateClick = (date: Date) => {
    if (!checkInDate || (checkInDate && checkOutDate)) {
      onCheckInDateSelect(date);
      onCheckOutDateSelect(null);
    } else {
      if (date <= checkInDate) {
        onCheckInDateSelect(date);
        onCheckOutDateSelect(null);
      } else {
        onCheckOutDateSelect(date);
        onClose!();
      }
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const renderCalendar = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });

    const firstDayIndex = start.getDay();

    return (
      <Grid container spacing={1}>
        {/* Days of the week headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Grid key={day} size={{ xs: 1.7 }}>
            <Typography
              variant="subtitle2"
              align="center"
              color="textSecondary"
            >
              {day}
            </Typography>
          </Grid>
        ))}

        {/* Add empty placeholders for the first week */}
        {Array.from({ length: firstDayIndex }).map((_, index) => (
          <Grid key={`empty-${index}`} size={{ xs: 1.7 }} />
        ))}

        {/* Render actual days */}
        {days.map((day) => {
          const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          const isDisabled = isDateDisabled(day);
          const isSelected = checkInDate && format(checkInDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') ||
                           checkOutDate && format(checkOutDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          const isInRange = checkInDate && checkOutDate && 
                          day > checkInDate && day < checkOutDate;

          return (
            <Grid key={day.getTime()} size={{ xs: 1.7 }}>
              <Paper
                elevation={1}
                sx={{
                  padding: 1,
                  textAlign: 'center',
                  backgroundColor: isSelected ? '#026672' : 
                                 isInRange ? '#028090' :
                                 isToday ? '#e3f2fd' :
                                 isDisabled ? 'grey.200' : '#fff',
                  color: (isSelected || isInRange) ? 'white' : 
                         isDisabled ? 'text.disabled' :
                         isToday ? '#026672' : '#028090',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                  '&:hover': {
                    backgroundColor: !isDisabled ? '#026672' : 'grey.200',
                  },
                  border: isSelected ? '2px solid #026672' : 
                          isToday ? '1px solid #026672' : 'none'
                }}
                onClick={() => {
                  if (isDisabled) {
                    displayError?.('Date not available');
                    return;
                  }
                  handleDateClick(day);
                }}
              >
                <Typography>{format(day, 'd')}</Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderCalendarContent = () => (
    <Box sx={{ 
      width: width, 
      p: 2,
      backgroundColor: 'white',
      borderRadius: '8px',
    //   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e5e7eb'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Box>
          <Typography variant="h6">Select dates</Typography>
          <Typography variant="body2" color="text.secondary">
            {checkInDate && checkOutDate
              ? `${format(checkInDate, 'MMM d')} - ${format(checkOutDate, 'MMM d')}`
              : checkInDate
              ? `${format(checkInDate, 'MMM d')} - Select checkout`
              : 'Select check-in date'}
          </Typography>
        </Box>
        {/* {onClose && onClose !== Function.prototype && (
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )} */}
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: showTwoMonths ? 6 : 12 }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <IconButton
              onClick={handlePrevMonth}
              disabled={isBefore(currentMonth, startOfToday())}
            >
              <NavigateBeforeIcon
                sx={{
                  color: isBefore(currentMonth, startOfToday())
                    ? 'grey.500'
                    : 'inherit',
                }}
              />
            </IconButton>
            <Box flexGrow={1} textAlign="center">
              <Typography variant="h6" gutterBottom>
                {format(currentMonth, 'MMMM yyyy')}
              </Typography>
            </Box>
            <IconButton onClick={handleNextMonth}>
              <NavigateNextIcon sx={{ color: 'inherit' }} />
            </IconButton>
          </Grid>
          {renderCalendar(currentMonth)}
        </Grid>
        {showTwoMonths && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container alignItems="center" justifyContent="space-between">
              <Box flexGrow={1} textAlign="center">
                <Typography variant="h6" gutterBottom>
                  {format(addMonths(currentMonth, 1), 'MMMM yyyy')}
                </Typography>
              </Box>
              <IconButton onClick={handleNextMonth}>
                <NavigateNextIcon sx={{ color: 'inherit' }} />
              </IconButton>
            </Grid>
            {renderCalendar(addMonths(currentMonth, 1))}
          </Grid>
        )}
      </Grid>
    </Box>
  );

  if (isMobileView) {
    return (
      <>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Check in"
            value={checkInDate ? format(checkInDate, 'MMM d, yyyy') : ''}
            onClick={() => setShowCalendar(true)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="Check out"
            value={checkOutDate ? format(checkOutDate, 'MMM d, yyyy') : ''}
            onClick={() => setShowCalendar(true)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Box>
        
        <Drawer
          anchor="bottom"
          open={showCalendar}
          onClose={() => setShowCalendar(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '85vh'
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            {renderCalendarContent()}
          </Box>
        </Drawer>
      </>
    );
  }

  return renderCalendarContent();
};

export default DateInput;