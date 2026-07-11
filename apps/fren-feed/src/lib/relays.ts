// Single source of truth for the relays this app runs on. Passed to
// <Cyphertap relays={RELAYS}/>. Follows' contact lists, profiles, and notes
// need to be findable here, so include a public relay alongside ours.
export const RELAYS = [
	// our own whitelisted strfry — home for this app's accounts (see
	// .test-accounts.json; unknown pubkeys get "blocked: pubkey not on whitelist")
	'wss://relay.abvstudio.net',
	// one public relay so follows' contact lists, profiles, and notes are
	// findable (primal chosen as the least likely to block us)
	'wss://relay.primal.net'
];
