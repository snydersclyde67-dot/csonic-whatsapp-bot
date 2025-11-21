const createResponse = (message, options = {}) => ({
  message,
  buttons: options.buttons || null,
  done: options.done || false,
  nextStep: options.nextStep || null,
});

const startFlow = () =>
  createResponse('💈 Barber bookings: please share your preferred date (YYYY-MM-DD). Reply "menu" to exit.', {
    nextStep: 'collectDate',
  });

const handleStep = (input, state) => {
  if (state.step === 'collectDate') {
    state.data.date = input;
    state.step = 'collectTime';
    return createResponse('Great! What time works best for that day? (e.g. 14:30)');
  }

  if (state.step === 'collectTime') {
    state.data.time = input;
    state.step = 'collectStyle';
    return createResponse('Got it. Any style preference? (fade, beard trim, etc.)');
  }

  if (state.step === 'collectStyle') {
    state.data.style = input;
    const { date, time, style } = state.data;
    return createResponse(
      `✅ Booking request received!\n• Date: ${date}\n• Time: ${time}\n• Style: ${style}\n\nOur team will confirm shortly.`,
      { done: true },
    );
  }

  state.step = 'collectDate';
  state.data = {};
  return createResponse('Let’s start again. What date suits you for the barber booking?');
};

module.exports = {
  keyword: 'barber',
  startFlow,
  handleStep,
};

