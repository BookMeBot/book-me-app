const initialPayloadToIntentAgent = {
  data: {
    chatId: "-4555870136",
    chatHistory: [
      {
        from: "ellie",
        message: "yo",
        timestamp: 214134135234,
      },
      {
        from: "ellie",
        message: "yo",
        timestamp: 214134135234,
      },
    ],
  },
};

const intitialReturnPayloadFromIntentAgent = {
  data: {
    chatId: "-4555870136",
    completedData: true || false,
    response: "We need x more data" || {
      requestData: {
        location: "Chiang Mai",
        startDate: 0,
        endDate: 0,
        numberOfGuests: 4,
        numberOfRooms: 2,
        features: ["Wi-Fi", "swimming pool"],
        budgetPerPerson: 200,
        currency: "USD",
      },
    },
  },
};

//then request data gets stored and url for

const payloadToSearchAgent = {
  data: {
    chatId: "-4555870136",
    chatHistory: [
      {
        from: "ellie",
        message: "yo",
        timestamp: 214134135234,
      },
      {
        from: "ellie",
        message: "yo",
        timestamp: 214134135234,
      },
    ],
    requestData: {
      location: "Chiang Mai",
      startDate: 0,
      endDate: 0,
      numberOfGuests: 4,
      numberOfRooms: 2,
      features: ["Wi-Fi", "swimming pool"],
      budgetPerPerson: 200,
      currency: "USD",
    },
  },
};

const returnPayloadFromSearchAgent = {
  data: {
    chatId: "-4555870136",
    response: [
      {
        name: "hotel 1",
        location: "chiang mai",
        price: 456,
      },
      {
        name: "hotel 2",
        location: "chiang mai",
        price: 456,
      },
    ],
  },
};

const payloadToSearchAgentRequestChanges = {
  data: {
    chatId: "-4555870136",
    chatHistory: [
      {
        from: "ellie",
        message: "yo",
        timestamp: 214134135234,
      },
      {
        from: "ellie",
        message: "yo",
        timestamp: 214134135234,
      },
    ],
    requestData: {
      location: "Chiang Mai",
      startDate: 0,
      endDate: 0,
      numberOfGuests: 4,
      numberOfRooms: 2,
      features: ["Wi-Fi", "swimming pool"],
      budgetPerPerson: 200,
      currency: "USD",
    },
  },
};
