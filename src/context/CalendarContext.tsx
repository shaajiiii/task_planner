import React, { createContext, useContext, useState, useMemo } from 'react';

export type CalendarEvent = {
  id?: string;
  start: number;
  end: number;
  label: string;
  color?: string;
  time?: string;
  status: string;
};

interface CalendarContextType {
  // Core events data
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  
  // Search and filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string[];
  setStatusFilter: (statuses: string[]) => void;
  
  // Computed filtered events
  filteredEvents: CalendarEvent[];
  
  // Helper methods
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (event: CalendarEvent) => void;
  clearFilters: () => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: React.ReactNode;
  initialEvents?: CalendarEvent[];
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({
  children,
  initialEvents = [],
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Compute filtered events based on search and filter criteria
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter - case insensitive search in title
      const matchesSearch = searchQuery === '' || 
        event.label.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter - if no statuses selected, show all
      const matchesStatus = statusFilter.length === 0 || 
        statusFilter.includes(event.status);
      
      return matchesSearch && matchesStatus;
    });
  }, [events, searchQuery, statusFilter]);

  // Helper methods
  const addEvent = (event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  };

  const updateEvent = (updatedEvent: CalendarEvent) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev))
    );
  };

  const deleteEvent = (eventToDelete: CalendarEvent) => {
    setEvents((prev) => prev.filter((ev) => ev !== eventToDelete));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
  };

  const value: CalendarContextType = {
    events,
    setEvents,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    clearFilters,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};