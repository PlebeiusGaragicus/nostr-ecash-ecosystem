// Single source of truth for the relays this app runs on. Passed to
// <Cyphertap relays={RELAYS}/>. Follows' contact lists, profiles, and notes
// need to be findable here, so include a few large public relays.
export const RELAYS = [
	'wss://relay.cypherflow.ai',
	'wss://relay.damus.io',
	'wss://relay.primal.net',
	'wss://nos.lol'
];
