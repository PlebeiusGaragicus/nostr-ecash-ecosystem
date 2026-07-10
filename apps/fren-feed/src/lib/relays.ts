// Single source of truth for the relays this app runs on. Passed to
// <Cyphertap relays={RELAYS}/>. Follows' contact lists, profiles, and notes
// need to be findable here, so include a few large public relays.
export const RELAYS = [
	// our own whitelisted strfry — home for this app's accounts (see
	// .test-accounts.json; unknown pubkeys get "blocked: pubkey not on whitelist")
	'wss://relay.abvstudio.net',
	// public relays so follows' contact lists, profiles, and notes are findable
	'wss://relay.damus.io',
	'wss://relay.primal.net',
	'wss://nos.lol'
];
