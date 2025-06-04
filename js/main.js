const PANELS = ["left", "middle", "right"];
const MAX_HP = 100, MAX_EN = 100;

const moves = {
  move: { energy: 1, icon: "⬅️" },
  attack: { energy: 2, damage: 8, icon: "👊" },
  block: { energy: 2, icon: "🛡️" },
  slip: { energy: 7, icon: "💨", cooldown: 2 },
  guardbreak: { energy: 6, damage: 18, icon: "🔨" },
  powermove: { energy: 12, damage: 30, loseTurn: true, icon: "⚡" },
  clinch: { energy: 4, heal: 15, gain: 10, loseTurn: true, icon: "🤝" },
  adrenaline: { energy: 0, heal: 35, gain: 25, loseTurn: true, icon: "💉" },
  fiftyfifty: { energy: 50, icon: "🎲" },
  oneanddone: { energy: "all", icon: "☠️" }
};

const MOVE_LABELS = {
  attack: "Attack",
  block: "Block",
  slip: "Slip n Slide",
  guardbreak: "Guard Break",
  powermove: "Power Move",
  clinch: "Clinch",
  adrenaline: "Adrenaline Surge",
  fiftyfifty: "Fifty Fifty",
  oneanddone: "One and Done"
};

function Fighter(name) {
  this.name = name;
  this.hp = MAX_HP;
  this.energy = MAX_EN;
  this.panel = "middle";
  this.busy = false;
  this.loseturn = false;
  this.cooldowns = {};
  this._lastAct = "";
  this._icon = "";
}
Fighter.prototype.ready = function(action) {
  if (this.busy || this.loseturn) return false;
  if (moves[action].cooldown && this.cooldowns[action] > 0) return false;
  if (moves[action].energy === "all") return this.energy > 0;
  if (action === "fiftyfifty") return this.energy >= moves.fiftyfifty.energy && (!this.cooldowns[action] || this.cooldowns[action] === 0);
  return this.energy >= moves[action].energy && (!this.cooldowns[action] || this.cooldowns[action] === 0);
};

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
let player, enemy, gameOver = false;

function drawPanels() {
  const pr = document.getElementById("player-panels");
  const er = document.getElementById("enemy-panels");
  pr.innerHTML = "";
  er.innerHTML = "";
  for (let i = 0; i < 3; ++i) {
    // --- Player ---
    let p = document.createElement("div");
    p.className = "panel" + (player.panel === PANELS[i] ? " active" : "");
    if (player.panel === PANELS[i]) {
      let f = document.createElement("div");
      let extraClass = "";
      if (player._lastAct === "block") extraClass = " block-indicator";
      else if (player._lastAct === "slip") extraClass = " slip-indicator";
      else if (player._lastAct === "powermove") extraClass = " powermove-indicator";
      else if (player._lastAct === "fiftyfifty") extraClass = " fiftyfifty-indicator";
      else if (player._lastAct === "oneanddone") extraClass = " oneanddone-indicator";
      else if (player._lastAct === "adrenaline") extraClass = " adrenaline-indicator";
      else if (player._lastAct === "clinch") extraClass = " clinch-indicator";
      else if (player._lastAct === "guardbreak") extraClass = " guardbreak-indicator";
      f.className = "fighter player" + extraClass;
      p.appendChild(f);
    }
    pr.appendChild(p);
    // --- Enemy ---
    let e = document.createElement("div");
    e.className = "panel" + (enemy.panel === PANELS[i] ? " enemy-active" : "");
    if (enemy.panel === PANELS[i]) {
      let f = document.createElement("div");
      let extraClass = "";
      if (enemy._lastAct === "block") extraClass = " block-indicator";
      else if (enemy._lastAct === "slip") extraClass = " slip-indicator";
      else if (enemy._lastAct === "powermove") extraClass = " powermove-indicator";
      else if (enemy._lastAct === "fiftyfifty") extraClass = " fiftyfifty-indicator";
      else if (enemy._lastAct === "oneanddone") extraClass = " oneanddone-indicator";
      else if (enemy._lastAct === "adrenaline") extraClass = " adrenaline-indicator";
      else if (enemy._lastAct === "clinch") extraClass = " clinch-indicator";
      else if (enemy._lastAct === "guardbreak") extraClass = " guardbreak-indicator";
      f.className = "fighter enemy" + extraClass;
      e.appendChild(f);
    }
    er.appendChild(e);
  }
}

function render() {
  drawPanels();
  document.getElementById('player-hp').innerText = `${player.hp}/${MAX_HP}`;
  document.getElementById('player-en').innerText = `${player.energy}/${MAX_EN}`;
  document.getElementById('player-panel').innerText = capitalize(player.panel);
  document.getElementById('enemy-hp').innerText = `${enemy.hp}/${MAX_HP}`;
  document.getElementById('enemy-en').innerText = `${enemy.energy}/${MAX_EN}`;
  document.getElementById('enemy-panel').innerText = capitalize(enemy.panel);

  document.getElementById("player-action-icon").innerHTML = player._icon ? `<span class="icon">${player._icon}</span>` : "";
  document.getElementById("enemy-action-icon").innerHTML = enemy._icon ? `<span class="icon">${enemy._icon}</span>` : "";

  ["attack","block","slip","guardbreak","powermove","clinch","adrenaline","fiftyfifty","oneanddone"].forEach(a => {
    let btn = document.getElementById(a);
    btn.disabled = gameOver || !player.ready(a);
    let label = btn.querySelector(".action-label");
    let cd = player.cooldowns[a] || 0;
    if (label && cd > 0) label.innerText = `${MOVE_LABELS[a]} (${cd})`;
    else if (label) label.innerText = MOVE_LABELS[a];
  });

  ["move-left","move-middle","move-right"].forEach(id => {
    let pos = id.split('-')[1];
    let btn = document.getElementById(id);
    btn.disabled = gameOver || (player.panel===pos) || player.busy || player.loseturn || player.energy < moves.move.energy;
  });
  document.getElementById("restart-btn").style.display = gameOver ? "" : "none";
}

function clearLog() { document.getElementById("combat-log").innerHTML = ""; }
function logMsg(msg) {
  const logDiv = document.getElementById("combat-log");
  let div = document.createElement("div");
  div.className = "log-entry";
  div.innerHTML = msg;
  logDiv.appendChild(div);
  logDiv.scrollTop = logDiv.scrollHeight;
}
function setPanel(fighter, pos) {
  fighter.panel = pos;
}
function useEnergy(fighter, amt) {
  if (amt === "all") fighter.energy = 0;
  else fighter.energy = clamp(fighter.energy - amt, 0, MAX_EN);
}
function heal(fighter, hp) {
  fighter.hp = clamp(fighter.hp + hp, 0, MAX_HP);
}
function energize(fighter, amt) {
  fighter.energy = clamp(fighter.energy + amt, 0, MAX_EN);
}
function setCooldown(fighter, act) {
  if (moves[act] && moves[act].cooldown)
    fighter.cooldowns[act] = moves[act].cooldown + 1;
}
function reduceCooldowns(fighter) {
  for (let key in fighter.cooldowns) {
    if (fighter.cooldowns[key] > 0) {
      fighter.cooldowns[key]--;
      if (fighter.cooldowns[key] <= 0) delete fighter.cooldowns[key];
    }
  }
}
function resetGame() {
  player = new Fighter("Player");
  enemy = new Fighter("Enemy");
  gameOver = false;
  clearLog();
  render();
}

function resolveMove(fighter, toPanel) {
  if (gameOver) return;
  if (fighter.loseturn) {
    fighter.loseturn = false;
    render();
    return;
  }
  if (!fighter.ready("move") || fighter.busy) return false;
  setPanel(fighter, toPanel);
  useEnergy(fighter, moves.move.energy);
  fighter.busy = true;
  fighter._lastAct = "";
  fighter._icon = "";
  render();
  setTimeout(() => { fighter.busy = false; render(); }, 160);
  if (fighter === player) maybeEnemy();
}

function resolveAction(fighter, action) {
  if (gameOver) return;
  if (fighter.loseturn) {
    fighter.loseturn = false;
    render();
    return;
  }
  if (!fighter.ready(action) || fighter.busy) return false;
  let foe = fighter===player ? enemy : player;
  let msg = "";
  fighter._lastAct = action;
  fighter._icon = moves[action].icon || "";
  setCooldown(fighter, action);

  if (moves[action].loseTurn) {
    fighter.loseturn = true;
    if (fighter === player) {
      setTimeout(() => { fighter.loseturn = false; render(); }, 350);
    }
  }

  let foeBlocked = foe._lastAct === "block";
  let foeSlipped = foe._lastAct === "slip";
  let foeSpecial = ["powermove", "fiftyfifty", "oneanddone"].includes(action);
  let playerSpecial = ["powermove", "fiftyfifty", "oneanddone"].includes(foe._lastAct);

  if (!foeBlocked && !foeSlipped) foe._icon = moves[foe._lastAct] ? moves[foe._lastAct].icon : "";

  if (action === "attack") {
    if (fighter.panel === foe.panel) {
      let dmg = moves.attack.damage;
      if (foeBlocked && foe.panel === fighter.panel) {
        if (fighter._lastAct === "guardbreak") dmg *= 2, msg += `<b>${foe.name}</b> blocks but it's a Guard Break! `;
        else if (fighter._lastAct && ["powermove","fiftyfifty","oneanddone"].includes(fighter._lastAct)) dmg *= 0.4;
        else dmg *= 0.2;
        heal(foe, 2); energize(foe, 2);
        msg += `<b>${foe.name}</b> blocks and gains +2 HP, +2 EN! `;
      }
      if (foeSlipped && foe.panel === fighter.panel) {
        if (["guardbreak", "powermove", "fiftyfifty", "oneanddone"].includes(action)) dmg *= 0.5;
        else dmg = 0, msg += `<b>${foe.name}</b> slips and counters for +5! `, foeSpecial = false;
      }
      if (dmg > 0) {
        foe.hp = clamp(foe.hp - dmg, 0, MAX_HP);
        msg += `<b>${fighter.name}</b> attacks! ${foeBlocked ? "(Blocked)" : ""}${foeSlipped ? "(Slipped)":""} ${foe.name} takes ${dmg} damage.`;
      } else {
        msg += `<b>${fighter.name}</b> attacks but ${foe.name} avoids all damage!`;
      }
      if (foeSlipped && dmg === 0 && fighter.panel === foe.panel && !foeSpecial) {
        fighter.hp = clamp(fighter.hp - 5, 0, MAX_HP);
        msg += ` <b>${foe.name}</b> counters! <b>${fighter.name}</b> takes 5 damage.`;
      }
      if (foeSlipped && !["attack","guardbreak","powermove","fiftyfifty","oneanddone"].includes(action)) {
        useEnergy(foe, 4);
        msg += ` <b>${foe.name}</b> wasted effort slipping and loses 4 EN.`;
      }
    } else {
      msg = `<b>${fighter.name}</b> attacks but ${foe.name} is not aligned.`;
    }
    useEnergy(fighter, moves.attack.energy);
  } else if (action === "block") {
    useEnergy(fighter, moves.block.energy);
    msg = `<b>${fighter.name}</b> is blocking.`;
  } else if (action === "slip") {
    useEnergy(fighter, moves.slip.energy);
    setCooldown(fighter, "slip");
    msg = `<b>${fighter.name}</b> is slipping.`;
  } else if (action === "guardbreak") {
    if (fighter.panel === foe.panel) {
      let dmg = moves.guardbreak.damage;
      if (foeBlocked && foe.panel === fighter.panel) dmg *= 2, msg += `<b>${foe.name}</b> blocks but it's a Guard Break! `;
      if (foeSlipped && foe.panel === fighter.panel) {
        if (["powermove", "fiftyfifty", "oneanddone"].includes(action)) dmg *= 0.5;
        else dmg = 0, msg += `<b>${foe.name}</b> slips and counters for +5! `, foeSpecial = false;
      }
      if (dmg > 0) {
        foe.hp = clamp(foe.hp - dmg, 0, MAX_HP);
        msg += `<b>${fighter.name}</b> uses Guard Break! ${foeBlocked ? "(Blocked)" : ""}${foeSlipped ? "(Slipped)":""} ${foe.name} takes ${dmg} damage.`;
      } else {
        msg += `<b>${fighter.name}</b> uses Guard Break but ${foe.name} avoids all damage!`;
      }
      if (foeSlipped && dmg === 0 && fighter.panel === foe.panel && !foeSpecial) {
        fighter.hp = clamp(fighter.hp - 5, 0, MAX_HP);
        msg += ` <b>${foe.name}</b> counters! <b>${fighter.name}</b> takes 5 damage.`;
      }
      if (foeSlipped && !["attack","guardbreak","powermove","fiftyfifty","oneanddone"].includes(action)) {
        useEnergy(foe, 4);
        msg += ` <b>${foe.name}</b> wasted effort slipping and loses 4 EN.`;
      }
    } else {
      msg = `<b>${fighter.name}</b> uses Guard Break but not aligned!`;
    }
    useEnergy(fighter, moves.guardbreak.energy);
  } else if (action === "powermove") {
    if (fighter.panel === foe.panel) {
      let dmg = moves.powermove.damage;
      let ko = false;
      if (foeBlocked && foe.panel === fighter.panel) dmg *= 0.4, msg += `<b>${foe.name}</b> blocks Power Move! `;
      if (foeSlipped && foe.panel === fighter.panel) dmg *= 0.5, msg += `<b>${foe.name}</b> slips Power Move! `;
      if (dmg > 0 && Math.random() < 0.10) { ko = true; foe.hp = 0; }
      else foe.hp = clamp(foe.hp - dmg, 0, MAX_HP);
      msg += `<b>${fighter.name}</b> unleashes <span style="color:#e040fc;">${["Shoryuken!","Falcon Punch!"][Math.floor(Math.random()*2)]}</span>! ${ko ? "<b>KO!</b>" : `${foeBlocked?"(Blocked)":""}${foeSlipped?"(Slipped)":""} ${foe.name} ${dmg>0?`takes ${dmg} damage.`:"takes no damage."}`}`;
    } else {
      msg = `<b>${fighter.name}</b> uses Power Move but not aligned!`;
    }
    useEnergy(fighter, moves.powermove.energy);
  } else if (action === "clinch") {
    heal(fighter, moves.clinch.heal);
    energize(fighter, moves.clinch.gain);
    useEnergy(fighter, moves.clinch.energy);
    msg = `<b>${fighter.name}</b> clinches! +${moves.clinch.heal} HP, +${moves.clinch.gain} EN.`;
  } else if (action === "adrenaline") {
    heal(fighter, moves.adrenaline.heal);
    energize(fighter, moves.adrenaline.gain);
    useEnergy(fighter, moves.adrenaline.energy);
    msg = `<b>${fighter.name}</b> surges with adrenaline! +${moves.adrenaline.heal} HP, +${moves.adrenaline.gain} EN.`;
  } else if (action === "fiftyfifty") {
    useEnergy(fighter, moves.fiftyfifty.energy);
    let hit = Math.random() < 0.5;
    if (hit && fighter.panel === foe.panel) {
      let dmg = Math.floor(foe.hp / 2);
      if (foeBlocked && foe.panel === fighter.panel) dmg *= 0.4, msg += `<b>${foe.name}</b> blocks 50/50! `;
      if (foeSlipped && foe.panel === fighter.panel) dmg *= 0.5, msg += `<b>${foe.name}</b> slips 50/50! `;
      foe.hp = clamp(foe.hp - dmg, 0, MAX_HP);
      msg = `<b>${fighter.name}</b> uses Fifty Fifty! ${hit ? (dmg > 0 ? `It hits for ${dmg}!` : "(Slipped/Blocked)") : "It failed."}`;
    } else {
      msg = `<b>${fighter.name}</b> uses Fifty Fifty! It failed.`;
    }
  } else if (action === "oneanddone") {
    useEnergy(fighter, fighter.energy);
    if (fighter.panel === foe.panel) {
      if (Math.random() < 1/3) {
        let reduce = Math.floor(MAX_HP * 0.9);
        if (foeBlocked && foe.panel === fighter.panel) {
          foe.hp = clamp(foe.hp - reduce, 0, MAX_HP);
          msg = `<b>${fighter.name}</b> used One and Done! Enemy blocks and loses 90% HP (${reduce}).`;
        } else if (foeSlipped && foe.panel === fighter.panel) {
          let odmg = Math.floor(MAX_HP * 0.9 * 0.5);
          foe.hp = clamp(foe.hp - odmg, 0, MAX_HP);
          msg = `<b>${fighter.name}</b> used One and Done, but opponent slipped and only takes ${odmg}!`;
        } else {
          foe.hp = 0;
          msg = `<b>${fighter.name}</b> used One and Done! <b>KO!</b>`;
        }
      } else {
        msg = `<b>${fighter.name}</b> used One and Done but it failed.`;
      }
    } else {
      msg = `<b>${fighter.name}</b> uses One and Done but not aligned!`;
    }
  }
  fighter.busy = true;
  render();
  setTimeout(() => { fighter.busy = false; render(); }, 230);
  reduceCooldowns(player);
  reduceCooldowns(enemy);
  logMsg(msg);
  if (fighter === player) maybeEnemy();
  checkEnd();
}
function checkEnd() {
  if (gameOver) return;
  let playerDead = player.hp <= 0 || player.energy <= 0;
  let enemyDead = enemy.hp <= 0 || enemy.energy <= 0;
  if (playerDead && enemyDead) {
    logMsg(`<b>Game Over!</b> Draw!`);
    gameOver = true;
  } else if (enemyDead) {
    logMsg(`<b>Game Over!</b> You Win!`);
    gameOver = true;
  } else if (playerDead) {
    logMsg(`<b>Game Over!</b> Enemy Wins!`);
    gameOver = true;
  }
  if (gameOver) {
    render();
    document.getElementById("restart-btn").style.display = "";
  }
}

// --- Improved AI ---
function maybeEnemy() {
  if (gameOver) return;
  if (enemy.busy || enemy.loseturn) {
    enemy.loseturn = false;
    return;
  }
  if (enemy.panel !== player.panel && enemy.energy >= moves.move.energy) {
    if (Math.random() < 0.7) {
      setTimeout(() => resolveMove(enemy, player.panel), 400);
      return;
    } else {
      const rand = Math.random();
      if (rand < 0.33) {
        let panels = PANELS.filter(p => p !== enemy.panel);
        let randPanel = panels[Math.floor(Math.random() * panels.length)];
        setTimeout(() => resolveMove(enemy, randPanel), 400);
        return;
      } else if (rand < 0.66) {
        tryEnemyAction();
        return;
      } else {
        setTimeout(maybeEnemy, 400);
        return;
      }
    }
  } else {
    tryEnemyAction();
  }
}
function tryEnemyAction() {
  let opts = [];
  if (enemy.hp < 40 && enemy.ready("adrenaline")) opts.push("adrenaline");
  if (enemy.hp < 60 && enemy.ready("clinch")) opts.push("clinch");
  if (enemy.ready("powermove")) opts.push("powermove");
  if (enemy.ready("guardbreak")) opts.push("guardbreak");
  if (enemy.ready("attack")) opts.push("attack");
  if (enemy.ready("fiftyfifty")) opts.push("fiftyfifty");
  if (enemy.ready("oneanddone")) opts.push("oneanddone");
  if (enemy.ready("block")) opts.push("block");
  if (enemy.ready("slip")) opts.push("slip");
  if (opts.length === 0) return;
  let act = opts[Math.floor(Math.random()*opts.length)];
  setTimeout(() => resolveAction(enemy, act), 400);
}

["move-left","move-middle","move-right"].forEach(id => {
  document.getElementById(id).onclick = () => {
    let pos = id.split('-')[1];
    resolveMove(player, pos);
  };
});
["attack","block","slip","guardbreak","powermove","clinch","adrenaline","fiftyfifty","oneanddone"].forEach(a => {
  document.getElementById(a).onclick = () => resolveAction(player, a);
});
document.getElementById("restart-btn").onclick = resetGame;

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
resetGame();
