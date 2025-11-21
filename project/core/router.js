const whatsappService = require('../services/whatsappService');
const barberModule = require('../modules/barber');
const carwashModule = require('../modules/carwash');
const logger = require('../utils/logger');

const userStates = new Map();

const COMMANDS = {
  menu: 'menu',
  help: 'help',
  barber: barberModule.keyword,
  carwash: carwashModule.keyword,
};

const MENU_BUTTONS = [
  { id: 'cmd_barber', title: 'Barber' },
  { id: 'cmd_carwash', title: 'Car Wash' },
  { id: 'cmd_help', title: 'Help' },
];

const getState = (id) => {
  if (!userStates.has(id)) {
    userStates.set(id, { flow: null, step: null, data: {} });
  }
  return userStates.get(id);
};

const resetState = (id) => {
  userStates.delete(id);
};

const sendHelp = async (to) => {
  await whatsappService.sendMessage(
    to,
    `CSonic Bot Commands:
- menu: view available services
- barber: book a barber appointment
- carwash: request a car wash
- help: see this message again`,
  );
};

const sendMenu = async (to) => {
  await whatsappService.sendInteractiveMessage(to, 'Choose a CSonic service to continue:', MENU_BUTTONS);
};

const parseCommand = (input = '') => input.trim().toLowerCase();

const handleModuleResponse = async (to, state, response) => {
  if (!response) return;

  if (response.buttons) {
    await whatsappService.sendInteractiveMessage(to, response.message, response.buttons);
  } else {
    await whatsappService.sendMessage(to, response.message);
  }

  if (response.nextStep) {
    state.step = response.nextStep;
  }

  if (response.done) {
    resetState(to);
    await sendMenu(to);
  }
};

const startFlow = async (module, to) => {
  const state = getState(to);
  state.flow = module.keyword;
  state.data = {};
  state.step = null;
  const response = module.startFlow();
  await handleModuleResponse(to, state, response);
};

const continueFlow = async (module, to, input) => {
  const state = getState(to);
  const response = module.handleStep(input, state);
  await handleModuleResponse(to, state, response);
};

const handleUnknown = async (to) => {
  await whatsappService.sendMessage(
    to,
    'I did not catch that. Type "menu" to see available services or "help" for assistance.',
  );
  await sendMenu(to);
};

const routeByCommand = async (command, to) => {
  switch (command) {
    case COMMANDS.menu:
      resetState(to);
      await sendMenu(to);
      return true;
    case COMMANDS.help:
      resetState(to);
      await sendHelp(to);
      return true;
    case COMMANDS.barber:
      await startFlow(barberModule, to);
      return true;
    case COMMANDS.carwash:
      await startFlow(carwashModule, to);
      return true;
    default:
      return false;
  }
};

const sanitizeCommand = (value) => value.replace(/^cmd_(menu_)?/, '');

const handleMessage = async ({ from, text, buttonId }) => {
  const inputPayload = (buttonId || text || '').trim();
  const normalizedInput = parseCommand(inputPayload);
  const commandCandidate = sanitizeCommand(normalizedInput);

  if (!normalizedInput) {
    await handleUnknown(from);
    return;
  }

  const handled = await routeByCommand(commandCandidate, from);
  if (handled) {
    return;
  }

  const state = userStates.get(from);
  if (state?.flow === barberModule.keyword) {
    await continueFlow(barberModule, from, inputPayload);
    return;
  }

  if (state?.flow === carwashModule.keyword) {
    await continueFlow(carwashModule, from, inputPayload);
    return;
  }

  await handleUnknown(from);
};

const handleIncomingPayload = async (message) => {
  try {
    await handleMessage(message);
  } catch (error) {
    logger('Router handling error', error.message || error);
    throw error;
  }
};

module.exports = {
  handleIncomingPayload,
};

