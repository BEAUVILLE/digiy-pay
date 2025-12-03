// app.js — DIGIY PAY + DIGIY CHAT HEADER (Mamadou DIGIY-2024-00001)

// -------------------- 1. Firebase INIT --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 🔐 DIGIYLYFE-PROD — PROD OFFICIEL
const firebaseConfig = {
  apiKey: "AIzaSyBqEQWoE2iC7_rp-u4riilNVHolcP2o0B0",  authDomain: "sinuous-ally-467909-f6.firebaseapp.com",
  databaseURL: "https://sinuous-ally-467909-f6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sinuous-ally-467909-f6",
  storageBucket: "sinuous-ally-467909-f6.appspot.com",
  messagingSenderId: « 1007962643384",
  appId: "1:1007962643384:web:20d26881e87f0dc37d0d4d"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DIGIY ID DU PRO (Mamadou chauffeur)
const DIGIY_ID = "DIGIY-2024-00001";

// -------------------- 2. UTILITAIRES UI --------------------
const logBox = document.getElementById("log");
const statusText = document.getElementById("statusText");
const instructionsEl = document.getElementById("instructions");
const transactionIdLabel = document.getElementById("transactionIdLabel");
const transactionIdSpan = document.getElementById("transactionId");
const btnPay = document.getElementById("btnPay");
const methodsContainer = document.getElementById("methods");

let qrcodeInstance = null;
const qrcodeContainer = document.getElementById("qrcode");

function addLog(message, type = "info") {
  if (!logBox) return;
  const line = document.createElement("div");
  line.className = "log-line";

  const time = new Date().toLocaleTimeString("fr-FR", { hour12: false });
  const spanTime = document.createElement("span");
  spanTime.className = "time";
  spanTime.textContent = `[${time}] `;

  const spanMsg = document.createElement("span");
  spanMsg.textContent = message;
  if (type === "ok") spanMsg.classList.add("ok");
  if (type === "err") spanMsg.classList.add("err");

  line.appendChild(spanTime);
  line.appendChild(spanMsg);
  logBox.prepend(line);
}

// -------------------- 3. HEADER DIGIY CHAT + WALLET --------------------
const avatarEl = document.getElementById("dc-avatar");
const nameEl = document.getElementById("dc-name");
const subEl = document.getElementById("dc-subscription");
const levelSpan = document.getElementById("dc-level");
const statusEl = document.getElementById("dc-status");
const walletEl = document.getElementById("dc-wallet");
const unreadEl = document.getElementById("dc-unread");
const btnOpenChat = document.getElementById("dc-openChat");

// Charger les infos abonné (profil + abonnement + chat)
(function initSubscriberHeader() {
  const subRef = ref(db, `subscribers/${DIGIY_ID}`);

  onValue(subRef, snapshot => {
    const data = snapshot.val();
    if (!data) {
      addLog("Aucun abonné trouvé pour " + DIGIY_ID, "err");
      return;
    }

    const profile = data.profile || {};
    const subscription = data.subscription || {};
    const digiyChat = data.digiyChat || {};
    const unreadCount = digiyChat.unreadCount ?? 0;

    // Avatar
    if (avatarEl) {
      avatarEl.src =
        profile.avatar ||
        "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(profile.displayName || "DIGIY PRO");
    }

    // Nom
    if (nameEl) {
      nameEl.textContent =
        profile.displayName ||
        `${profile.prenom || ""} ${profile.nom || ""}`.trim() ||
        DIGIY_ID;
    }

    // Abonnement
    if (levelSpan) {
      levelSpan.textContent = subscription.level || "—";
    }
    if (subEl) {
      subEl.innerHTML = `Abonnement <span class="badge" id="dc-level">${subscription.level || "—"}</span>`;
    }

    // Statut en ligne
    if (statusEl) {
      const online = !!profile.online;
      const dotSpan = statusEl.querySelector(".dot");
      const textSpan = statusEl.querySelector("span:last-child");
      if (dotSpan) {
        dotSpan.style.background = online ? "#22c55e" : "#6b7280";
        dotSpan.style.boxShadow = online
          ? "0 0 0 4px rgba(34,197,94,0.4)"
          : "0 0 0 0 rgba(0,0,0,0)";
      }
      if (textSpan) {
        textSpan.textContent = online ? "En ligne" : "Hors ligne";
      }
    }

    // Unread
    if (unreadEl) {
      unreadEl.textContent = unreadCount;
    }

    addLog("Header DIGIY CHAT chargé pour " + DIGIY_ID, "ok");
  });

  // Wallet
  const walletRef = ref(db, `digiyPay/wallets/${DIGIY_ID}`);
  onValue(walletRef, snapshot => {
    const data = snapshot.val();
    if (!data) return;
    const balance = data.balance ?? 0;
    const currency = data.currency || "XOF";
    if (walletEl) {
      walletEl.textContent = `${balance.toLocaleString("fr-FR")} ${currency}`;
    }
    addLog("Solde wallet mis à jour : " + balance + " " + currency, "ok");
  });

  // Bouton ouvrir chat (placeholder : URL PRO CHAT)
  if (btnOpenChat) {
    btnOpenChat.addEventListener("click", () => {
      addLog("Ouverture DIGIY CHAT PRO pour " + DIGIY_ID, "info");
      // 👉 adapte l’URL si besoin
      window.open(
        "https://beauville.github.io/digiy-chat-pro/?digiyId=" + DIGIY_ID,
        "_blank"
      );
    });
  }
})();

// -------------------- 4. UI méthodes de paiement --------------------
if (methodsContainer) {
  const chips = methodsContainer.querySelectorAll(".method-chip");
  chips.forEach(chip => {
    const input = chip.querySelector("input[type=radio]");
    if (!input) return;
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      input.checked = true;
    });
    // Active par défaut si déjà checked
    if (input.checked) {
      chip.classList.add("active");
    }
  });
}

// -------------------- 5. QR CODE INIT --------------------
function ensureQrInstance() {
  if (!qrcodeInstance) {
    // qrcodejs est chargé via script dans le HTML
    qrcodeInstance = new QRCode(qrcodeContainer, {
      text: "",
      width: 120,
      height: 120
    });
  }
}

// Génère un contenu symbolique pour Wave / OM / etc.
function buildPaymentPayload({ amount, method, reference, proName }) {
  // Ici tu pourras plus tard mettre un vrai lien Wave / OM.
  // Pour l’instant : simple payload texte.
  return `DIGIY_PAY|method=${method}|amount=${amount}|ref=${reference || ""}|pro=${proName || ""}`;
}

// -------------------- 6. GESTION DU FORMULAIRE --------------------
const form = document.getElementById("payForm");

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!btnPay) return;

    const amountInput = document.getElementById("amount");
    const currencySelect = document.getElementById("currency");
    const customerNameInput = document.getElementById("customerName");
    const referenceInput = document.getElementById("reference");
    const moduleSelect = document.getElementById("module");
    const proNameInput = document.getElementById("proName");
    const proIdInput = document.getElementById("proId");
    const noteInput = document.getElementById("note");

    const amount = Number(amountInput.value || 0);
    const currency = currencySelect.value || "XOF";
    const customerName = customerNameInput.value.trim();
    const reference = referenceInput.value.trim();
    const moduleValue = moduleSelect.value;
    const proName = proNameInput.value.trim();
    const proId = proIdInput.value.trim();
    const note = noteInput.value.trim();

    const methodInput = form.querySelector('input[name="method"]:checked');
    const method = methodInput ? methodInput.value : null;

    if (!amount || amount <= 0) {
      addLog("Montant invalide", "err");
      alert("Montant invalide.");
      return;
    }
    if (!method) {
      addLog("Choisir une méthode de paiement", "err");
      alert("Choisis une méthode de paiement.");
      return;
    }

    btnPay.disabled = true;
    statusText.textContent = "Création de la transaction en cours…";

    const now = Date.now();
    const isoNow = new Date(now).toISOString();
    const transactionId = `TRX-${now}`;

    const transactionRef = ref(db, `digiyPay/transactions/${transactionId}`);

    // Sous-type pour driver / resto / etc.
    let subType = moduleValue;
    if (moduleValue === "driver") subType = "ride";

    const payload = {
      transactionId,
      type: "service_payment",
      subType,
      amount,
      currency,
      sender: {
        // Ici, on suppose que le client paye
        name: customerName || "Client DIGIY",
        // dans ton schéma tu peux rajouter un digiyId client plus tard
      },
      receiver: {
        digiyId: DIGIY_ID,
        name: proName || "PRO DIGIY",
        proId: proId || null
      },
      status: "pending",
      commission: 0,
      description: note || reference || "",
      metadata: {
        service: moduleValue,
        reference: reference || null,
        customerName: customerName || null,
        proName: proName || null,
        proId: proId || null,
        note: note || null,
        chatConversation: null // tu pourras lier une conv plus tard
      },
      timestamps: {
        created: isoNow
      }
    };

    try {
      await set(transactionRef, payload);

      addLog(`Transaction créée : ${transactionId}`, "ok");

      // Affichage UI
      transactionIdSpan.textContent = transactionId;
      transactionIdLabel.style.display = "block";

      const payloadText = buildPaymentPayload({
        amount,
        method,
        reference: reference || transactionId,
        proName
      });

      ensureQrInstance();
      qrcodeInstance.clear();
      qrcodeInstance.makeCode(payloadText);

      let txt = "";
      switch (method) {
        case "wave":
          txt = `Demande au client de scanner le QR avec son app Wave pour payer ${amount.toLocaleString(
            "fr-FR"
          )} ${currency}.`;
          break;
        case "orange":
          txt = `Demande au client d’ouvrir Orange Money et de payer ${amount.toLocaleString(
            "fr-FR"
          )} ${currency} au numéro indiqué. Note la réf : ${reference || transactionId}.`;
          break;
        case "free":
          txt = `Demande au client de payer via Free Money pour ${amount.toLocaleString(
            "fr-FR"
          )} ${currency}.`;
          break;
        case "cash":
          txt = `Encaissement CASH : le client te donne ${amount.toLocaleString(
            "fr-FR"
          )} ${currency} en main propre. Valide ensuite la transaction dans ton back-office.`;
          break;
        default:
          txt = "Paiement généré. Suis les instructions convenues avec le client.";
      }

      statusText.textContent = "Transaction enregistrée. En attente du paiement client.";
      instructionsEl.innerHTML = txt;

    } catch (err) {
      console.error(err);
      addLog("Erreur enregistrement transaction : " + err.message, "err");
      alert("Erreur lors de l’enregistrement Firebase.");
      statusText.textContent = "Erreur lors de la création du paiement.";
    } finally {
      btnPay.disabled = false;
    }
  });
}

// Log initial
addLog("DIGIY PAY prêt. Firebase connecté. DIGIY ID = " + DIGIY_ID, "ok");
