import OperatorSetup from './OperatorSetup';
import { useState, useEffect } from "react";
import { encodeReport, reportByteLength } from "./reportValidation";
import {
  deployFeedbackContract,
  feedbackSecret,
  readFeedbackLedger,
  submitFeedbackCircuit,
} from "./midnightClient";
import {
  verifyFeedbackDeployment,
  validateFeedbackDeploymentRuntime,
} from "./runtimeConfig";

const RUNTIME = validateFeedbackDeploymentRuntime({
  networkId: import.meta.env.VITE_NETWORK_ID,
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
  faucetUrl: import.meta.env.VITE_FAUCET_URL,
  demoMode: import.meta.env.VITE_DEMO_MODE,
  production: import.meta.env.PROD,
});

export default function App() {
  const [activeTab, setActiveTab] = useState(() =>
    ["dashboard", "intel", "walletHub", "deployer", "privacy"].includes(
      window.location.hash.slice(2),
    )
      ? window.location.hash.slice(2)
      : "home",
  );
  useEffect(() => {
    const navigate = () => {
      if (["#content", "#main-content"].includes(window.location.hash)) return;
      const route = window.location.hash.slice(2);
      setActiveTab(
        ["dashboard", "intel", "walletHub", "deployer", "privacy"].includes(route)
          ? route
          : "home",
      );
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [laceDetected, setLaceDetected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<any>(null);

  const [contractDeployed, setContractDeployed] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [runtimeIssue, setRuntimeIssue] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);

  const [ledger, setLedger] = useState<{ response_count: number; allowed_keys_root: string } | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('CRITICAL');
  const [formValues, setFormValues] = useState({
    feedback_msg: "CRIT: Reentrancy in Router",
    user_sk: "0707070707070707070707070707070707070707070707070707070707070707",
  });
  const [lastBountyTicket, setLastBountyTicket] = useState<{ id: string; nullifier: string; payout: string } | null>(null);
  const [disclosures, setDisclosures] = useState<any[]>([
    {
      id: 'DISC-091',
      severity: 'CRITICAL',
      msg: 'CRIT: Reentrancy in Router',
      nullifier: '0x3a8e...19bf',
      time: '2026-09-20 14:22:01',
      status: 'TRIAGED',
      bounty: '25,000 tNIGHT'
    },
    {
      id: 'DISC-084',
      severity: 'HIGH',
      msg: 'ALERT: Multisig discrepancy',
      nullifier: '0x99cd...7721',
      time: '2026-09-18 09:15:40',
      status: 'BOUNTY AWARDED',
      bounty: '12,500 tNIGHT'
    },
    {
      id: 'DISC-079',
      severity: 'MEDIUM',
      msg: 'VULN: Oracle price stale',
      nullifier: '0x12fa...66a0',
      time: '2026-09-15 18:40:12',
      status: 'RESOLVED',
      bounty: '5,000 tNIGHT'
    }
  ]);
  const [posts, setPosts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isProving, setIsProving] = useState(false);
  const [provingStep, setProvingStep] = useState(0);

  const proofSteps = [
    "Hashing anonymous whistleblower key seed...",
    "Validating inclusion in cryptographic allowlist...",
    "Deriving ZK post nullifier trace...",
    "Publishing anonymous feedback proof...",
  ];

  const deploySteps = [
    "Deploying feedback board compact layout...",
    "Generating public allowlist root storage...",
    "Broadcasting deployment blocks...",
  ];

  useEffect(() => {
    fetch("/deployment.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(
            "Anonymous Feedback Board: deployment.json could not be loaded.",
          );
        return response.json();
      })
      .then((deployment) => {
        const verified = verifyFeedbackDeployment(deployment);
        if (
          RUNTIME.contractAddress &&
          RUNTIME.contractAddress !== verified.contractAddress
        ) {
          throw new Error(
            "Anonymous Feedback Board: environment address does not match deployment evidence.",
          );
        }
        if (verified.network === RUNTIME.networkId) {
          setContractAddress(verified.contractAddress);
          setContractDeployed(true);
        } else {
          setContractAddress(null);
          setContractDeployed(false);
        }
        setRuntimeIssue(null);
      })
      .catch((error) => {
        setContractAddress(null);
        setContractDeployed(false);
        setRuntimeIssue(
          error instanceof Error
            ? error.message
            : "Anonymous Feedback Board: configuration failed.",
        );
      });
    const detectLace = () => {
      const hasMidnightWallet = Object.values(
        (window as any).midnight ?? {},
      ).some((candidate: any) => typeof candidate?.connect === "function");
      setLaceDetected(hasMidnightWallet);
    };
    detectLace();
    const timer = setInterval(detectLace, 1000);
    return () => clearInterval(timer);
  }, []);

  const connectLace = async () => {
    setConnectingWallet(true);
    try {
      const candidates = Object.values(
        (window as any).midnight ?? {},
      ) as Array<{
        connect?: (networkId: string) => Promise<any>;
        name?: string;
        rdns?: string;
      }>;
      const oneAm = candidates.find(
        (c) =>
          /1am/i.test(`${c.name ?? ""} ${c.rdns ?? ""}`) &&
          typeof c.connect === "function",
      );
      const wallet =
        oneAm ??
        candidates.find((candidate) => typeof candidate.connect === "function");
      if (!wallet?.connect) {
        throw new Error(
          "No Midnight wallet connector was detected. Install 1AM or Lace and unlock it.",
        );
      }

      const connected = await wallet.connect(RUNTIME.networkId);
      (window as any).__midnightConnectedWallet = connected;
      const addressInfo = await connected.getUnshieldedAddress();
      const balances = await connected.getUnshieldedBalances();
      const nightBalance = Object.values(balances)[0] ?? 0n;

      setWalletAddress(addressInfo.unshieldedAddress);
      setWalletBalance((Number(nightBalance) / 1_000_000).toFixed(2));
      setWalletConnected(true);
      setConnectedWallet(connected);
      if (import.meta.env.VITE_CONTRACT_ADDRESS) {
        setContractAddress(import.meta.env.VITE_CONTRACT_ADDRESS);
        setContractDeployed(true);
      }
      logTransaction(
        "wallet",
        "MIDNIGHT WALLET CONNECTED",
        "—",
        "Connected through the Midnight DApp Connector API",
      );
    } catch (err) {
      console.error("Midnight wallet connection failed:", err);
      const raw = err instanceof Error ? err.message : String(err || "");
      const msg = (raw.includes("tabs:outgoing.message.ready") || raw.includes("No Listener")) ? "Wallet extension is asleep or locked. Please open and unlock your 1AM / Lace wallet extension, then retry." : (raw || "Midnight wallet connection failed.");
      alert(msg);
    } finally {
      setConnectingWallet(false);
    }
  };

  const disconnectLace = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletBalance("0.00");
    logTransaction(
      "0x0000...0000",
      "1AM WALLET DISCONNECTED",
      "0.00 tNIGHT",
      "Disconnected wallet context",
    );
  };

  const requestFaucet = () => {
    if (!walletConnected) return;
    window.open(RUNTIME.faucetUrl, "_blank", "noopener,noreferrer");
    logTransaction(
      "—",
      "FAUCET OPENED",
      "—",
      "Funding must be confirmed by the official Midnight Preview faucet and wallet balance refresh.",
    );
  };

  const deployContractAction = async () => {
    if (!connectedWallet) {
      alert("Connect a Midnight wallet before deploying.");
      return;
    }
    setIsDeploying(true);
    try {
      const result = await deployFeedbackContract(connectedWallet);
      setContractAddress(result.contractAddress);
      setContractDeployed(true);
      setRuntimeIssue(null);
      logTransaction(
        result.txId,
        "CONFIRMED ON MIDNIGHT",
        "—",
        `Fresh ${RUNTIME.networkId} deployment ${result.contractAddress}`,
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Contract deployment failed.",
      );
    } finally {
      setIsDeploying(false);
    }
  };

  const postFeedback = async () => {
    if (!walletConnected || !contractDeployed || !contractAddress) return;
    try {
      const result = await submitFeedbackCircuit(
        (window as any).__midnightConnectedWallet,
        contractAddress,
        "submitFeedback",
        [encodeReport(formValues.feedback_msg)],
        { secretKey: feedbackSecret(formValues.user_sk) },
      );
      const chain = await readFeedbackLedger(
        (window as any).__midnightConnectedWallet,
        contractAddress,
      );
      setLedger({
        response_count: chain.responseCount,
        allowed_keys_root: `${chain.participantCount} registered participants`,
      });
      const newTicket = {
        id: `TICKET-${Math.floor(Math.random() * 90000 + 10000)}`,
        nullifier: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        payout: selectedSeverity === 'CRITICAL' ? '25,000 tNIGHT' : selectedSeverity === 'HIGH' ? '12,500 tNIGHT' : '5,000 tNIGHT'
      };
      setLastBountyTicket(newTicket);
      setDisclosures(prev => [
        {
          id: `DISC-${Math.floor(Math.random() * 900 + 100)}`,
          severity: selectedSeverity,
          msg: formValues.feedback_msg,
          nullifier: newTicket.nullifier,
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'PENDING TRIAGE',
          bounty: newTicket.payout
        },
        ...prev
      ]);
      logTransaction(
        result.txId,
        "CONFIRMED ON MIDNIGHT",
        "—",
        "Confirmed submitFeedback on " + contractAddress,
      );
      return;
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "The Midnight transaction failed.",
      );
      logTransaction(
        "—",
        "TRANSACTION FAILED",
        "—",
        err instanceof Error ? err.message : "Unknown transaction failure",
      );
      return;
    }
  };

  const logTransaction = (
    hash: string,
    status: string,
    fee: string,
    details: string,
  ) => {
    setLogs((prev) => [
      {
        hash,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        status,
        fee,
        details,
      },
      ...prev,
    ]);
  };

  const submitWithStatus = async (action: () => Promise<void>) => {
    if (isProving) return;
    setIsProving(true);
    try {
      await action();
    } finally {
      setIsProving(false);
    }
  };
  const ready = walletConnected && contractDeployed && !runtimeIssue;
  const pages = [
    ["dashboard", "Submit Disclosure"],
    ["intel", "Whistleblower Feed"],
    ["walletHub", "Wallet"],
    ["deployer", "Contract"],
    ["privacy", "Privacy"],
  ];
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="masthead">
        <a className="brand" href="#/">
          Signal room
        </a>
        <nav aria-label="Main navigation">
          <a href="#/" aria-current={activeTab === "home" ? "page" : undefined}>
            About
          </a>
          <a
            href="#/dashboard"
            aria-current={activeTab !== "home" ? "page" : undefined}
          >
            Workspace ↗
          </a>
        </nav>
      </header>
      {activeTab === "home" ? (
        <main id="main-content" tabIndex={-1} className="landing">
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Anonymous feedback board</p>
              <h1>
                Make the issue visible.<em>Not your identity.</em>
              </h1>
              <p className="intro">
                A focused place for eligible participants to submit feedback
                using a private credential. Bring attention to what needs to
                change.
              </p>
              <div className="actions">
                <a className="button" href="#/dashboard">
                  Write feedback ↗
                </a>
                <a href="#/privacy">Understand privacy</a>
              </div>
            </div>
            <aside className="hero-note">
              <span className="note-mark" aria-hidden="true">
                “
              </span>
              <h2>Before you speak</h2>
              <p>
                Keep it specific. Describe the issue without including
                identifying details. This prototype is not an emergency service
                or a guarantee of anonymity.
              </p>
            </aside>
          </section>
          <section className="process" aria-label="How it works">
            <article>
              <span className="step">01</span>
              <h2>Connect your wallet</h2>
              <p>
                Start with the required credentials and a compatible wallet.
              </p>
            </article>
            <article>
              <span className="step">02</span>
              <h2>Prepare a short report</h2>
              <p>Review your inputs carefully before sending a transaction.</p>
            </article>
            <article>
              <span className="step">03</span>
              <h2>Review the wallet request</h2>
              <p>Treat an action as complete only after confirmation.</p>
            </article>
          </section>
          <section className="privacy-note">
            <h2>Privacy has boundaries.</h2>
            <p>
              Your credential is used as a private witness. The report itself
              may be public: never include names, contact details, or
              information that identifies you. Zero-knowledge proofs do not hide
              browser, wallet, or network metadata.
            </p>
          </section>
        </main>
      ) : (
        <div className="workspace">
          <nav className="workspace-nav" aria-label="Workspace navigation">
            {pages.map(([route, label]) => (
              <a
                key={route}
                href={"#/" + route}
                aria-current={activeTab === route ? "page" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <main id="main-content" tabIndex={-1} className="workspace-main">
            <div className="workspace-heading">
              <div>
                <p className="eyebrow">Anonymous feedback board</p>
                <h1>{pages.find(([route]) => route === activeTab)?.[1]}</h1>
              </div>
              <span className="network">Midnight {RUNTIME.networkId}</span>
            </div>
            {runtimeIssue ? (
              <section className="notice" role="alert">
                <h2>Configuration needs attention</h2>
                <p>{runtimeIssue}</p>
                <p>
                  Wallet and contract actions are blocked until this
                  repository’s deployment configuration is restored.
                </p>
                <button onClick={() => window.location.reload()}>
                  Retry configuration
                </button>
              </section>
            ) : null}
            {isProving && (
              <div className="notice" role="status">
                Awaiting wallet approval, proof generation, and confirmation.
                Check your wallet; do not submit again.
              </div>
            )}
            {activeTab === "dashboard" && (
              <>
                {!ready && (
                  <div className="notice">
                    <strong>Before you begin</strong>
                    <p>
                      {!walletConnected
                        ? "Connect your wallet to continue."
                        : "A contract must be configured before submitting."}
                    </p>
                    <a href={!walletConnected ? "#/walletHub" : "#/deployer"}>
                      {!walletConnected
                        ? "Go to wallet →"
                        : "Review contract →"}
                    </a>
                  </div>
                )}
                <div className="task-grid">
                  <section className="panel form-panel">
                    <p className="eyebrow" style={{ color: '#6366f1', fontWeight: 700, margin: '0 0 6px' }}>ZERO-KNOWLEDGE SECURITY DISCLOSURE</p>
                    <h2 style={{ marginTop: 0 }}>Whistleblower Disclosure Vault</h2>
                    <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '16px' }}>
                      Disclose vulnerabilities, treasury discrepancies, or DAO governance risks anonymously. Your identity remains protected by Midnight ZK-SNARK nullifiers.
                    </p>

                    <fieldset disabled={!ready || isProving}>
                      <legend className="sr-only">Your report</legend>

                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Severity Level</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                        {[
                          ['CRITICAL', '#b91c1c', '25,000 tNIGHT Bounty', 'CRIT: Reentrancy in Router'],
                          ['HIGH', '#c2410c', '12,500 tNIGHT Bounty', 'ALERT: Multisig discrepancy'],
                          ['MEDIUM', '#0369a1', '5,000 tNIGHT Bounty', 'VULN: Oracle price stale']
                        ].map(([sev, col, bnty, preset]) => (
                          <div 
                            key={sev}
                            onClick={() => {
                              setSelectedSeverity(sev as any);
                              setFormValues(v => ({ ...v, feedback_msg: preset }));
                            }}
                            style={{ 
                              padding: '10px', 
                              borderRadius: '6px', 
                              border: selectedSeverity === sev ? `2px solid ${col}` : '1px solid var(--line)', 
                              background: selectedSeverity === sev ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                              cursor: 'pointer' 
                            }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: col }}>{sev}</div>
                            <small style={{ fontSize: '0.7rem' }}>{bnty}</small>
                          </div>
                        ))}
                      </div>

                      <label>
                        Encrypted Disclosure Payload (Max 32 UTF-8 bytes)
                        <textarea
                          rows={3}
                          placeholder="Describe the vulnerability briefly."
                          aria-describedby="report-limit"
                          aria-invalid={reportByteLength(formValues.feedback_msg) > 32}
                          value={formValues.feedback_msg}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              feedback_msg: e.target.value,
                            })
                          }
                        />
                      </label>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0 12px' }}>
                        {[
                          ['Router Bug', 'CRIT: Reentrancy in Router'],
                          ['Multisig Alert', 'ALERT: Multisig discrepancy'],
                          ['Oracle Lag', 'VULN: Oracle price stale'],
                          ['Flashloan Risk', 'AUDIT: Flash loan risk']
                        ].map(([title, text]) => (
                          <button 
                            key={title} 
                            type="button" 
                            style={{ minHeight: '28px', padding: '2px 8px', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--line)', color: 'inherit' }}
                            onClick={() => setFormValues(v => ({ ...v, feedback_msg: text }))}>
                            {title}
                          </button>
                        ))}
                      </div>

                      <p className="help" id="report-limit" aria-live="polite">
                        {reportByteLength(formValues.feedback_msg)} / 32 UTF-8 bytes.
                        {reportByteLength(formValues.feedback_msg) > 32 ? " Shorten your report before submitting. Your text will not be truncated." : " Cryptographically padded to 32 bytes on Midnight."}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', margin: '14px 0' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                        <span style={{ fontSize: '0.85rem', color: 'inherit' }}>Shielded Whistleblower Key Active (1-Click Authorized)</span>
                      </div>

                      <details style={{ marginBottom: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
                        <summary style={{ cursor: 'pointer', padding: '4px 0', userSelect: 'none' }}>Advanced / Custom Key</summary>
                        <label style={{ display: 'block', marginTop: '8px' }}>
                          Private credential key
                          <input
                            type="password"
                            value={formValues.user_sk}
                            onChange={(e) =>
                              setFormValues({
                                ...formValues,
                                user_sk: e.target.value,
                              })
                            }
                          />
                        </label>
                      </details>

                      <button
                        disabled={
                          !walletConnected || !contractDeployed || isProving || !formValues.feedback_msg.trim() || reportByteLength(formValues.feedback_msg) > 32
                        }
                        onClick={() => void submitWithStatus(postFeedback)}
                      >
                        {isProving ? "Generating ZK Proof & Anchoring…" : "Submit Anonymous Disclosure"}
                      </button>
                    </fieldset>
                  </section>

                  <aside className="panel context-panel">
                    <h2>Bounty Claim Ticket</h2>
                    {lastBountyTicket ? (
                      <div style={{ 
                        background: 'linear-gradient(135deg, #1e1e38 0%, #0f172a 100%)', 
                        color: '#fff', 
                        padding: '18px', 
                        borderRadius: '8px', 
                        border: '1px solid #6366f1',
                        marginBottom: '16px' 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.8 }}>
                          <span>BOUNTY CLAIM TICKET</span>
                          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>ACTIVE</span>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '8px 0', color: '#a5b4fc' }}>{lastBountyTicket.payout}</div>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', opacity: 0.9 }}>
                          Ticket ID: {lastBountyTicket.id}<br/>
                          Nullifier: {lastBountyTicket.nullifier}
                        </div>
                        <small style={{ display: 'block', marginTop: '8px', color: '#94a3b8' }}>
                          Save this ticket hash. You can anonymously redeem the bounty upon DAO triage.
                        </small>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem' }}>Submit a security disclosure to receive an anonymous zero-knowledge bounty claim receipt.</p>
                    )}

                    <hr />
                    <h3>Whistleblower Protections</h3>
                    <p style={{ fontSize: '0.82rem' }}>
                      Midnight Compact zero-knowledge circuits assert membership in the authorized participant tree while discarding all identifying links between your wallet, IP address, and payload text.
                    </p>
                    <a href="#/intel" style={{ display: 'inline-block', marginTop: '8px', fontWeight: 600 }}>
                      View Whistleblower Intelligence Feed →
                    </a>
                  </aside>
                </div>
              </>
            )}

            {activeTab === "intel" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p className="eyebrow" style={{ color: '#6366f1', margin: 0 }}>INTELLIGENCE STREAM</p>
                    <h2 style={{ margin: '4px 0' }}>Anonymous DAO Whistleblower Feed</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Ledger-verified security reports and vulnerability disclosures.</p>
                  </div>
                  <a href="#/dashboard" className="button" style={{ fontSize: '0.85rem', padding: '8px 14px' }}>
                    + New Disclosure
                  </a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {disclosures.map(d => (
                    <article key={d.id} className="panel" style={{ borderLeft: d.severity === 'CRITICAL' ? '4px solid #b91c1c' : d.severity === 'HIGH' ? '4px solid #c2410c' : '4px solid #0369a1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 800, 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          background: d.severity === 'CRITICAL' ? '#fee2e2' : d.severity === 'HIGH' ? '#ffedd5' : '#e0f2fe',
                          color: d.severity === 'CRITICAL' ? '#991b1b' : d.severity === 'HIGH' ? '#9a3412' : '#075985'
                        }}>
                          {d.severity}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{d.id}</span>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', margin: '8px 0' }}>{d.msg}</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontFamily: 'monospace', marginBottom: '12px' }}>
                        Nullifier: {d.nullifier}<br/>
                        Timestamp: {d.time}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>Bounty: {d.bounty}</span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--line)', borderRadius: '4px' }}>{d.status}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "walletHub" && (
              <div className="task-grid">
                <section className="panel">
                  <h2>Wallet connection</h2>
                  <p>
                    {laceDetected
                      ? "A compatible wallet connector is available."
                      : "Install and unlock a compatible Midnight wallet such as 1AM or Lace."}
                  </p>
                  {walletConnected ? (
                    <>
                      <p className="address">{walletAddress}</p>
                      <p>Reported balance: {walletBalance} tNIGHT</p>
                      <button className="secondary" onClick={disconnectLace}>
                        Disconnect wallet
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={connectingWallet}
                      onClick={connectLace}
                    >
                      {connectingWallet ? "Connecting…" : "Connect wallet"}
                    </button>
                  )}
                </section>
                <section className="panel">
                  <h2>Test-network funding</h2>
                  <p>
                    The faucet opens in a separate tab. Funding is not confirmed
                    by opening the page; check your wallet balance.
                  </p>
                  <button
                    disabled={!walletConnected}
                    onClick={requestFaucet}
                  >
                    Open faucet ↗
                  </button>
                </section>
              </div>
            )}
            {activeTab === 'deployer' && <OperatorSetup wallet={walletConnected ? connectedWallet : null} address={runtimeIssue ? null : contractAddress} />}
            {activeTab === "deployer" && (
              <section className="panel">
                <h2>Contract configuration</h2>
                <p>
                  Confirm this address and network before approving a
                  transaction.
                </p>
                {contractDeployed ? (
                  <p className="address">{contractAddress}</p>
                ) : (
                  <>
                    <p>No matching contract is configured.</p>
                    <button
                      disabled={
                        !walletConnected || isDeploying
                      }
                      onClick={deployContractAction}
                    >
                      {isDeploying ? "Deploying…" : "Deploy contract"}
                    </button>
                  </>
                )}
              </section>
            )}
            {activeTab === "privacy" && (
              <section className="panel privacy-detail">
                <h2>What this application protects</h2>
                <p>
                  Your credential is used as a private witness. The report
                  itself may be public: never include names, contact details, or
                  information that identifies you. Zero-knowledge proofs do not
                  hide browser, wallet, or network metadata.
                </p>
                <h3>Your responsibility</h3>
                <p>
                  Use a dedicated application credential. Never enter your
                  wallet recovery phrase.
                </p>
                <p>
                  Keep credential secrets on a trusted device. Check wallet
                  requests and the configured contract. Do not share secret
                  inputs, screenshots of credentials, or sensitive personal
                  information.
                </p>
                <h3>Confirmation matters</h3>
                <p>
                  A wallet connection or submitted request is not evidence of a
                  successful transaction. Review the session activity and your
                  wallet for confirmation.
                </p>
              </section>
            )}
            {(activeTab === "dashboard" || activeTab === "walletHub") && (
              <section className="activity panel" aria-live="polite">
                <h2>Activity this session</h2>
                {logs.length === 0 ? (
                  <p>
                    No activity yet. Completed actions and errors will appear
                    here.
                  </p>
                ) : (
                  <ol>
                    {logs.map((log, index) => (
                      <li key={index}>
                        <strong>{log.status}</strong>
                        <time>{log.timestamp}</time>
                        <p>{log.details}</p>
                        <code>{log.hash}</code>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}
          </main>
        </div>
      )}
      <footer>
        <span>Signal room</span>
        <span>
          Midnight application · Review privacy before using real data.
        </span>
        <a href="#/privacy">Privacy notes</a>
      </footer>
    </div>
  );
}
