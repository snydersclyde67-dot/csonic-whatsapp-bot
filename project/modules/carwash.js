const createResponse = (message, options = {}) => ({
  message,
  buttons: options.buttons || null,
  done: options.done || false,
  nextStep: options.nextStep || null,
});

const packageButtons = [
  { id: 'carwash_basic', title: 'Basic Wash' },
  { id: 'carwash_deluxe', title: 'Deluxe Wash' },
  { id: 'carwash_detail', title: 'Detailing' },
];

const startFlow = () =>
  createResponse('🚗 Choose a car wash package:', {
    buttons: packageButtons,
    nextStep: 'selectPackage',
  });

const handleStep = (input, state) => {
  if (state.step === 'selectPackage') {
    const normalized = input.toLowerCase();
    state.data.package =
      normalized === 'carwash_basic'
        ? 'Basic Wash'
        : normalized === 'carwash_deluxe'
          ? 'Deluxe Wash'
          : normalized === 'carwash_detail'
            ? 'Detailing'
            : input;
    state.step = 'collectLocation';
    return createResponse('Awesome choice! Where should we meet your car? (send suburb or location pin)');
  }

  if (state.step === 'collectLocation') {
    state.data.location = input;
    state.step = 'collectTime';
    return createResponse('Noted. When should we be there? (e.g. Saturday 10am)');
  }

  if (state.step === 'collectTime') {
    state.data.time = input;
    const { package: pkg, location, time } = state.data;
    return createResponse(
      `🧽 Car wash scheduled!\n• Package: ${pkg}\n• Location: ${location}\n• Time: ${time}\n\nWe’ll send a confirmation soon.`,
      { done: true },
    );
  }

  state.step = 'selectPackage';
  state.data = {};
  return createResponse('Let’s restart your car wash request. Pick a package to continue:', { buttons: packageButtons });
};

module.exports = {
  keyword: 'carwash',
  startFlow,
  handleStep,
};

