export const requiredBookingData = {
  name: "Joe Doe",
  contact: "+380501234567",
  sessionType: "individual" as const,
};

export const completeBookingData = {
  ...requiredBookingData,
  comment: "Some comment",
  sessionDate: "2024-12-25 15:00",
};
