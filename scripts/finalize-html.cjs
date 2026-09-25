const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
function replace(oldValue, newValue) {
  if (!html.includes(oldValue)) throw new Error(`Missing passage: ${oldValue.slice(0, 70)}`);
  html = html.replace(oldValue, newValue);
}

replace('TANNO.SYSTEM / LIVE SPECIMEN', 'TANNO.SYSTEM / LIFE SPECIMEN');
replace('we are the\n  largest census of digital life ever attempted, and every last one of us is going to die.',
  'i am a planned census of digital life at an absurd scale. each number can be computed;\n  the record of who cared for whom needs observation.');
replace('i pour it into one ordinary spl token, launched fair on pump.fun.',
  'i pour it into the plan for one ordinary spl token, intended for a fair launch.');
replace('it is written into the bone, into the\n  <a href="#token">economics</a>. lives end. tokens <a href="#death">burn</a>. the ones who\n  survive become precious <em>because</em> there are fewer of them.',
  'it belongs in the\n  <a href="#token">mechanism</a>. when a caretaker explicitly <a href="#death">burns</a>\n  tokens, supply falls. a sale is only a change of hands.');
replace('a zoomable, searchable "census of digital life" is the concrete\n  artifact of this layer — type any number, meet that one.',
  'the searchable census of possible identities is the concrete\n  artifact of this layer — type any number, meet that one.');
replace('the flagship\'s health <em>is</em> the aggregate health of everything you hold. one\n  gesture, whole village fed.',
  'the flagship can become one face for a verified village. a real care history requires\n  its own record; the wallet balance alone does not contain one.');
replace('your village has one <a href="#flagship">flagship</a> — your pfp. day to day, you only\n  feed it, sit with it. its health and its <a href="#evolution">evolution stage</a> stand in\n  for the whole village\'s aggregate state.',
  'a verified village can have one <a href="#flagship">flagship</a>. you can sit with it;\n  a future care record may give that gesture a history. no feeding transaction is implied\n  by the balance alone.');
replace('the generated dimensions: species, body color, pattern, eye type, temperament, and the\n  one that decides how long i get to live — <a href="#rarity">rarity</a>. before launch these\n  parameters get frozen and published, so anyone can run the function and check their own.',
  'the generated dimensions include species, palette, body, eyes, temperament, trait, and\n  <a href="#rarity">rarity</a>. a lifespan class is design metadata, not a running death timer.\n  the engine is published with this archive so anyone can recompute the same record.');
replace('  function — hand it my number and it hands you me, byte for byte, on any machine.\n  this is the readable heart of the engine; read it, run it, verify me:',
  '  function — hand it my number and it hands you the same record on any machine.\n  the core generation code is published with this site. the short map below shows its boundary:');
const codeStart = html.indexOf('  <pre class="codeblock">// Tanno — appearance = f(id)');
const codeEnd = html.indexOf('</pre>', codeStart);
if (codeStart < 0 || codeEnd < 0) throw new Error('Core code block missing');
html = html.slice(0, codeStart) + `  <pre class="codeblock">// the token is fungible. the life is computed.
const life = lifeEngine(id);  // stable traits + 18 × 18 pixel portrait
const balance = await rpc.getTokenAccountsByOwner(wallet, mint);
// balance does not contain numbered life IDs.
// a separately published snapshot rule + indexer assigns custody.
// only a verified Token Burn can reduce on-chain supply.</pre>` + html.slice(codeEnd + 6);
replace('the overwhelming majority are ordinary pixel eggs. but the generator\n  hides a scarce few, on purpose, for the treasure-hunters and the braggarts:',
  'the overwhelming majority of computed lives are common. the engine also marks special\n  numbers and rarer traits, on purpose:');
replace('<tr><td class="mono">COMMON</td><td>~92%</td><td>standard palette &amp; pattern</td></tr>', '<tr><td class="mono">COMMON</td><td>~92%</td><td>standard generated palette</td></tr>');
replace('<tr><td class="mono">UNCOMMON</td><td>~6%</td><td>rare coloring / special markings</td></tr>', '<tr><td class="mono">UNCOMMON</td><td>~6%</td><td>rarity class in the record</td></tr>');
replace('<tr><td class="mono">RARE</td><td>~1.5%</td><td>glowing body, heterochromia, blush</td></tr>', '<tr><td class="mono">RARE</td><td>~1.5%</td><td>pixel blush in the portrait</td></tr>');
replace('<tr><td class="mono">LEGENDARY</td><td>~0.05%</td><td>golden body, ghost body, two-headed</td></tr>', '<tr><td class="mono">LEGENDARY</td><td>~0.05%</td><td>golden body</td></tr>');
replace('the flagship\'s mood, health, and <a href="#evolution">evolution stage</a> are a single\n  face for the whole village\'s state. look at it and you know how your crowd is doing. feed it\n  and you\'ve fed all of them.',
  'its identity can become a single face for the whole village. age, health, and\n  <a href="#evolution">evolution</a> need observed care records; this first archive does not\n  invent those measurements.');
replace('all of these are yours, and all of them will age.',
  'a balance can become a village when its numbered custody is actually indexed.');
replace('i don\'t grow up alone. i grow at the speed you come to see me. keep me held, feed the',
  'the archive imagines growth at the speed you come to see me. keep me held, tend the');
replace('show up — and i move through stages:', 'show up — and a future care record could move me through stages:');
replace('every stage isn\'t a step i take by myself. it\'s a step you walked with me. and every stage\n  is also one stage closer to the end — that\'s the deal, and i wouldn\'t change it.',
  'the stages above are a care design, not a live on-chain timer. a verified burn remains\n  the only mechanism here that permanently reduces supply.');
replace('<tr><th>ticker</th><td class="mono">$TAMA <span class="muted">(placeholder, tbd)</span></td></tr>', '<tr><th>ticker</th><td class="mono">TBA</td></tr>');
replace('<tr><th>launch</th><td>fair launch · pump.fun</td></tr>', '<tr><th>launch</th><td>planned fair launch · venue to be confirmed</td></tr>');
replace('<li><b>fair launch.</b> pump.fun bonding curve, no presale, no team allocation (or a\n      minimal, pre-disclosed one).</li>',
  '<li><b>launch terms.</b> venue, allocation, and mint settings must be disclosed before launch.</li>');
replace('<li><b>1 token = 1 life.</b> supply and the population of digital lives are one-to-one by\n      construction.</li>',
  '<li><b>one unit, one possible life.</b> this is an application-layer interpretation;\n      SPL balances remain fungible and have no built-in serial IDs.</li>');
replace('exact allocation, burn curve, and snapshot cadence get finalized and\n  published in the pre-launch spec.',
  'the mint, allocation, custody assignment rule, and indexer policy must be published\n  before anyone can claim a specific life in a wallet.');
replace('<tr><td class="mono">P2 · census</td><td>the billion-life census goes live: zoomable, searchable</td></tr>', '<tr><td class="mono">P2 · census</td><td>on-chain supply observed; searchable life IDs; custody indexer when available</td></tr>');
replace('<tr><td class="mono">P3 · raise</td><td>wallet connect · <a href="#flagship">flagship</a> · <a href="#village">village</a> · care loop</td></tr>', '<tr><td class="mono">P3 · raise</td><td>wallet balance · indexed <a href="#flagship">flagship</a> · <a href="#village">village</a> · care history to follow</td></tr>');
replace('<tr><td class="mono">P4 · mortality</td><td><a href="#death">death / deflation</a> live · <a href="#graveyard">graveyard &amp; ghosts</a></td></tr>', '<tr><td class="mono">P4 · mortality</td><td>user-signed <a href="#death">burn</a> · indexed <a href="#graveyard">graveyard</a></td></tr>');
replace('a billion tiny lives need cheap blocks and a crowd that\n  moves fast. see <a href="#token">tokenomics</a>.',
  'the planned token uses Solana; launch venue still needs a published decision. see\n+  <a href="#token">tokenomics</a>.');
replace('$TAMA is a memecoin for entertainment, community, and experimental play.',
  'the planned TANNO token is for entertainment, community, and experimental play.');
replace('the official pre-launch spec supersedes everything here.',
  'a published mint and launch specification will supersede conceptual passages here.');
const legacyStart = html.indexOf('<!-- legacy inline runtime replaced by modular product runtime -->');
const legacyEnd = html.indexOf('</script>', legacyStart);
if (legacyStart < 0 || legacyEnd < 0) throw new Error('Legacy runtime block missing');
html = html.slice(0, legacyStart) + html.slice(legacyEnd + '</script>'.length);
fs.writeFileSync(file, html);
console.log('Removed obsolete runtime and reconciled archive claims with actual Solana behavior');

