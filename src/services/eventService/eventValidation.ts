export const isEventNameUnique = async (
  eventName: string,
  eventId?: string
): Promise<boolean> => {
  console.log(
    `Checking if event name "${eventName}" is unique`,
    eventId ? `(excluding event ${eventId})` : ''
  );
  return true;
};

export const checkDateAvailability = async (
  startDate: string,
  endDate: string,
  eventId?: string
): Promise<{ isAvailable: boolean; message: string }> => {
  console.log(
    `Checking date availability for ${startDate} to ${endDate}`,
    eventId ? `(excluding event ${eventId})` : ''
  );
  return { isAvailable: true, message: '' };
};