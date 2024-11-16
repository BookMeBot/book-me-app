export type RequestData = {
  location: string;
  startDate: number;
  endDate: number;
  numberOfGuests: number;
  numberOfRooms: number;
  features: string[];
  budgetPerPerson: number;
  currency: string;
};

export type AgentResponse = {
  data: {
    chatId: string;
    completedData: boolean;
    response:
      | string
      | {
          requestData: RequestData;
        };
  };
};
