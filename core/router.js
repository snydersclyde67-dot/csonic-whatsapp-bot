const logger = require('../utils/logger');
const {
  sendWhatsAppMessage,
  sendInteractiveWhatsAppMessage,
} = require('../modules/generic');
const barberModule = require('../modules/barber');
const carwashModule = require('../modules/carwash');

const userStates = new Map();

const COMMANDS = {
  menu: 'menu',
  help: 'help',
  barber: 'barber',
  carwash: 'carwash',
};

const MENU_BUTTONS = [
  { id: 'cmd_barber', title: 'Barber' },
  { id: 'cmd_carwash', title: 'Car Wash' },
  { id: 'cmd_help', title: 'Help' },
];

const getState = (id) => {
  if (!userStates.has(id)) {
    userStates.set(id, { flow: null, step: null, data: {}, businessId: null });
  }
  return userStates.get(id);
};

const resetState = (id) => {
  userStates.delete(id);
};

const sendHelp = async ({ from, business }) => {
  const businessName = business?.name || 'CSonic';
  await sendWhatsAppMessage(
    from,
    `CSonic Bot Commands for ${businessName}:
- menu: view available services
- barber: book a barber appointment
- carwash: request a car wash
- help: show this menu again`,
    business?.id,
  );
};

const sendMenu = async ({ from, business }) => {
  try {
    await sendInteractiveWhatsAppMessage(
      from,
      'Choose a CSonic service to continue:',
      MENU_BUTTONS,
      business?.id,
    );
  } catch (error) {
    logger('Falling back to text menu', error.message || error);
    await sendWhatsAppMessage(
      from,
      'Available services:\n1. Barber\n2. Car Wash\nReply with "barber" or "carwash" to continue.',
      business?.id,
    );
  }
};

const sanitizeCommand = (value = '') => value.replace(/^cmd_(menu_)?/, '');

const handleModuleResponse = async (ctx, state, response) => {
  if (!response) return;

  if (response.buttons) {
    await sendInteractiveWhatsAppMessage(ctx.from, response.message, response.buttons, state.businessId);
  } else {
    await sendWhatsAppMessage(ctx.from, response.message, state.businessId);
  }

  if (response.nextStep) {
    state.step = response.nextStep;
  }

  if (response.done) {
    resetState(ctx.from);
    await sendMenu(ctx);
  }
};

const startFlow = async (moduleKey, module, ctx) => {
  if (!module.startInteractiveFlow || !module.handleInteractiveStep) {
    return false;
  }

  const state = getState(ctx.from);
  state.flow = moduleKey;
  state.step = null;
  state.data = {};
  state.businessId = ctx.business?.id || null;

  const response = module.startInteractiveFlow();
  await handleModuleResponse(ctx, state, response);
  return true;
};

const continueFlow = async (module, ctx, input) => {
  const state = getState(ctx.from);
  const response = module.handleInteractiveStep(input, state);
  await handleModuleResponse(ctx, state, response);
};

const routeByCommand = async (command, ctx) => {
  switch (command) {
    case COMMANDS.menu:
      resetState(ctx.from);
      await sendMenu(ctx);
      return true;
    case COMMANDS.help:
      resetState(ctx.from);
      await sendHelp(ctx);
      return true;
    case COMMANDS.barber:
      await startFlow('barber', barberModule, ctx);
      return true;
    case COMMANDS.carwash:
      await startFlow('carwash', carwashModule, ctx);
      return true;
    default:
      return false;
  }
};

const handleUnknown = async (ctx) => {
  await sendWhatsAppMessage(
    ctx.from,
    'I did not catch that. Type "menu" to see available services or "help" for assistance.',
    ctx.business?.id,
  );
  await sendMenu(ctx);
};

const handleIncomingPayload = async ({ from, text, buttonId, business, customer }) => {
  const ctx = { from, business, customer };
  const inputPayload = (buttonId || text || '').trim();
  const normalizedInput = inputPayload.toLowerCase();
  const commandCandidate = sanitizeCommand(normalizedInput);

  if (!normalizedInput) {
    await handleUnknown(ctx);
    return true;
  }

  const handled = await routeByCommand(commandCandidate, ctx);
  if (handled) {
    return true;
  }

  const state = userStates.get(from);
  if (state?.flow === 'barber') {
    await continueFlow(barberModule, ctx, inputPayload);
    return true;
  }

  if (state?.flow === 'carwash') {
    await continueFlow(carwashModule, ctx, inputPayload);
    return true;
  }

  return false;
};

module.exports = {
  handleIncomingPayload,
};

