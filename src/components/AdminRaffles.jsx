import React, { useEffect, useMemo, useRef, useState } from 'react';
import initialRaffle from '../data/raffle.json';

const RAFFLE_STORAGE_KEY = 'margarita-admin-raffle';

const normalizeRaffle = (value) => ({
  ...initialRaffle,
  ...(value || {}),
  entries: value?.entries || {},
  lastWinners: Array.isArray(value?.lastWinners) ? value.lastWinners : []
});

const loadStoredRaffle = () => {
  if (typeof window === 'undefined') return normalizeRaffle(initialRaffle);

  try {
    return normalizeRaffle(JSON.parse(window.localStorage.getItem(RAFFLE_STORAGE_KEY)));
  } catch {
    return normalizeRaffle(initialRaffle);
  }
};

const saveStoredRaffle = (raffle) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(RAFFLE_STORAGE_KEY, JSON.stringify(raffle));
};

const getNumberKey = (number) => String(number);

const createRange = (start, end) => {
  const first = Number(start);
  const last = Number(end);

  if (!Number.isInteger(first) || !Number.isInteger(last) || first > last) return [];

  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
};

const pickWinners = (participants, winnerCount) => {
  const shuffled = [...participants];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, winnerCount).map((winner, index) => ({
    ...winner,
    position: index + 1
  }));
};

function TrophyIcon({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 10h28v9c0 10.3-5.5 18.5-14 18.5S18 29.3 18 19v-9Z"
        fill="currentColor"
      />
      <path
        d="M15 14H8v5c0 7.7 5 13 12.1 13M49 14h7v5c0 7.7-5 13-12.1 13"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="6"
      />
      <path
        d="M28 37h8v10h9v7H19v-7h9V37Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AdminRaffles() {
  const [raffle, setRaffle] = useState(loadStoredRaffle);
  const [draft, setDraft] = useState({
    startNumber: raffle.startNumber,
    endNumber: raffle.endNumber
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [winnerModal, setWinnerModal] = useState({
    isOpen: false,
    isDrawing: false,
    isRevealed: false,
    winners: []
  });
  const [countdown, setCountdown] = useState(5);
  const revealTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const numbers = useMemo(
    () => (raffle.active ? createRange(raffle.startNumber, raffle.endNumber) : []),
    [raffle.active, raffle.endNumber, raffle.startNumber]
  );

  const participants = useMemo(
    () =>
      numbers
        .map((number) => ({
          number,
          buyer: (raffle.entries[getNumberKey(number)] || '').trim()
        }))
        .filter((entry) => entry.buyer),
    [numbers, raffle.entries]
  );

  const suspenseNumbers = useMemo(() => {
    const source = participants.length ? participants.map((entry) => entry.number) : numbers;

    return source.slice(0, 12);
  }, [numbers, participants]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const saveRaffle = (nextRaffle) => {
    setRaffle(nextRaffle);
    saveStoredRaffle(nextRaffle);
  };

  const showMessage = (nextMessage, nextType = 'success') => {
    setMessage(nextMessage);
    setMessageType(nextType);
  };

  const startRaffle = (event) => {
    event.preventDefault();

    const startNumber = Number(draft.startNumber);
    const endNumber = Number(draft.endNumber);

    if (!Number.isInteger(startNumber) || !Number.isInteger(endNumber)) {
      showMessage('Carga un numero inicial y final validos.', 'error');
      return;
    }

    if (startNumber > endNumber) {
      showMessage('El numero inicial no puede ser mayor al numero final.', 'error');
      return;
    }

    const nextRaffle = normalizeRaffle({
      active: true,
      startNumber,
      endNumber,
      winnerCount: 1,
      uniqueWinner: true,
      entries: {},
      lastWinners: []
    });

    saveRaffle(nextRaffle);
    showMessage(`Sorteo iniciado del ${startNumber} al ${endNumber}.`);
  };

  const updateBuyer = (number, value) => {
    const key = getNumberKey(number);
    const nextEntries = {
      ...raffle.entries,
      [key]: value
    };

    if (!value.trim()) {
      delete nextEntries[key];
    }

    saveRaffle({
      ...raffle,
      entries: nextEntries
    });
  };

  const updateWinnerCount = (value) => {
    const winnerCount = Math.max(1, Number(value || 1));

    saveRaffle({
      ...raffle,
      winnerCount,
      uniqueWinner: winnerCount === 1
    });
  };

  const toggleUniqueWinner = (checked) => {
    saveRaffle({
      ...raffle,
      uniqueWinner: checked,
      winnerCount: checked ? 1 : Math.max(2, Number(raffle.winnerCount || 2))
    });
  };

  const drawRaffle = () => {
    if (winnerModal.isOpen) return;

    if (!participants.length) {
      showMessage('Necesitas al menos un numero con comprador para sortear.', 'error');
      return;
    }

    const requestedWinners = raffle.uniqueWinner ? 1 : Math.max(1, Number(raffle.winnerCount || 1));

    if (requestedWinners > participants.length) {
      showMessage(
        `Hay ${participants.length} participante(s). Baja la cantidad de ganadores para que no se repitan numeros.`,
        'error'
      );
      return;
    }

    const winners = pickWinners(participants, requestedWinners);

    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
    }

    setWinnerModal({
      isOpen: true,
      isDrawing: false,
      isRevealed: false,
      winners
    });
    setCountdown(5);
    showMessage('');
  };

  const beginWinnerReveal = () => {
    if (!winnerModal.isOpen || winnerModal.isDrawing || winnerModal.isRevealed) return;

    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
    }
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
    }

    setCountdown(5);

    setWinnerModal((currentModal) => ({
      ...currentModal,
      isDrawing: true
    }));

    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((currentCountdown) => Math.max(1, currentCountdown - 1));
    }, 1000);

    revealTimerRef.current = window.setTimeout(() => {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      saveRaffle({
        ...raffle,
        lastWinners: winnerModal.winners
      });
      setWinnerModal((currentModal) => ({
        ...currentModal,
        isDrawing: false,
        isRevealed: true,
      }));
      showMessage('Sorteo realizado correctamente.');
      revealTimerRef.current = null;
    }, 5200);
  };

  const closeWinnerModal = () => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    setWinnerModal({
      isOpen: false,
      isDrawing: false,
      isRevealed: false,
      winners: []
    });
    setCountdown(5);
  };

  const deleteRaffle = () => {
    const confirmed = window.confirm(
      'Se va a eliminar el sorteo actual y todos los compradores cargados. Esta accion no se puede deshacer.'
    );

    if (!confirmed) return;

    const emptyRaffle = normalizeRaffle(initialRaffle);
    closeWinnerModal();
    setDraft({
      startNumber: '',
      endNumber: ''
    });
    saveRaffle(emptyRaffle);
    showMessage('Sorteo eliminado. Ya podes iniciar uno nuevo.');
  };

  if (winnerModal.isOpen) {
    return (
      <section className="admin-raffles raffle-draw-view">
        <div className="admin-heading">
          <div>
            <span>Sorteos</span>
            <h2>Sorteo en vivo</h2>
          </div>
          <button className="admin-secondary-button" type="button" onClick={closeWinnerModal}>
            Volver al sorteo
          </button>
        </div>

        <div className="raffle-draw-page">
          <div className="raffle-modal raffle-stage-card">
            {!winnerModal.isDrawing && !winnerModal.isRevealed && (
              <div className="raffle-ready-card">
                <div className="raffle-result-brand">
                  <img src="/logo-margarita.png" alt="Margarita Accesorios" />
                  <div>
                    <span>Sorteo preparado</span>
                    <strong>Margarita Accesorios</strong>
                  </div>
                </div>
                <TrophyIcon className="raffle-trophy raffle-trophy-left" />
                <TrophyIcon className="raffle-trophy raffle-trophy-right" />
                <h3>Todo listo para sortear</h3>
                <p>
                  Cuando aprietes comenzar, los numeros giran unos segundos y despues aparece el resultado.
                </p>
                <button className="admin-submit raffle-start-draw-button" type="button" onClick={beginWinnerReveal}>
                  Comenzar sorteo
                </button>
              </div>
            )}

            {winnerModal.isDrawing && (
              <div className="raffle-drawing">
                <span>Sorteo en curso</span>
                <h3>Buscando ganador...</h3>
                <div className="raffle-drum" aria-hidden="true">
                  <strong>{countdown}</strong>
                  {suspenseNumbers.map((number, index) => (
                    <b key={`${number}-${index}`} style={{ '--delay': `${index * 0.13}s` }}>
                      {number}
                    </b>
                  ))}
                </div>
                <p>Los numeros estan girando. El resultado aparece en unos segundos.</p>
              </div>
            )}

            {winnerModal.isRevealed && (
              <div className="raffle-result-card">
                <div className="raffle-result-brand">
                  <img src="/logo-margarita.png" alt="Margarita Accesorios" />
                  <div>
                    <span>Resultado oficial</span>
                    <strong>Margarita Accesorios</strong>
                  </div>
                </div>
                <TrophyIcon className="raffle-trophy raffle-trophy-left" />
                <TrophyIcon className="raffle-trophy raffle-trophy-right" />
                <h3>
                  {winnerModal.winners.length === 1
                    ? 'Ganador del sorteo'
                    : 'Podio ganador'}
                </h3>
                <div
                  className={`raffle-result-podium ${
                    winnerModal.winners.length === 1 ? 'is-single' : ''
                  }`}
                >
                  {winnerModal.winners.map((winner) => (
                    <article key={`${winner.position}-${winner.number}`}>
                      {winner.position === 1 && <TrophyIcon className="raffle-winner-trophy" />}
                      <small>{winner.position === 1 ? 'Ganador' : `Puesto ${winner.position}`}</small>
                      <strong>{winner.buyer}</strong>
                      <b>Numero {winner.number}</b>
                    </article>
                  ))}
                </div>
                <p>Margarita Accesorios</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-raffles">
      <div className="admin-heading">
        <div>
          <span>Sorteos</span>
          <h2>Administrar sorteos</h2>
        </div>
        {raffle.active && (
          <button className="admin-danger-button" type="button" onClick={deleteRaffle}>
            Eliminar sorteo
          </button>
        )}
      </div>

      {!raffle.active ? (
        <form className="admin-form raffle-start-form" onSubmit={startRaffle}>
          <div className="admin-form-section">
            <div className="admin-section-title">
              <span>Nuevo sorteo</span>
              <small>Defini el rango de numeros que se van a vender.</small>
            </div>

            <div className="raffle-start-grid">
              <label>
                <span>Numero inicial</span>
                <input
                  type="number"
                  step="1"
                  value={draft.startNumber}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      startNumber: event.target.value
                    }))
                  }
                  placeholder="0"
                />
              </label>

              <label>
                <span>Numero final</span>
                <input
                  type="number"
                  step="1"
                  value={draft.endNumber}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      endNumber: event.target.value
                    }))
                  }
                  placeholder="99"
                />
              </label>

              <button className="admin-submit" type="submit">
                Iniciar sorteo
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="raffle-workspace">
          <div className="raffle-summary">
            <div>
              <span>Rango</span>
              <strong>
                {raffle.startNumber} al {raffle.endNumber}
              </strong>
            </div>
            <div>
              <span>Numeros vendidos</span>
              <strong>{participants.length}</strong>
            </div>
            <div>
              <span>Numeros disponibles</span>
              <strong>{Math.max(0, numbers.length - participants.length)}</strong>
            </div>
          </div>

          <div className="raffle-controls admin-form-section">
            <div className="admin-section-title">
              <span>Configuracion</span>
              <small>Solo participan los numeros con comprador asociado.</small>
            </div>

            <div className="raffle-controls-grid">
              <label className="raffle-toggle">
                <input
                  type="checkbox"
                  checked={raffle.uniqueWinner}
                  onChange={(event) => toggleUniqueWinner(event.target.checked)}
                />
                <span>Ganador unico</span>
              </label>

              <label>
                <span>Cantidad de ganadores</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  disabled={raffle.uniqueWinner}
                  value={raffle.uniqueWinner ? 1 : raffle.winnerCount}
                  onChange={(event) => updateWinnerCount(event.target.value)}
                />
              </label>

              <div className="raffle-actions">
                <button
                  className="admin-submit"
                  type="button"
                  onClick={drawRaffle}
                  disabled={winnerModal.isOpen && !winnerModal.isRevealed}
                >
                  Sortear
                </button>
              </div>
            </div>
          </div>

          {raffle.lastWinners.length > 0 && (
            <div className="raffle-winners">
              <span>Resultado</span>
              <h3>
                {raffle.lastWinners.length === 1 ? 'Ganador del sorteo' : 'Podio ganador'}
              </h3>
              <div className="raffle-podium">
                {raffle.lastWinners.map((winner) => (
                  <article key={`${winner.position}-${winner.number}`}>
                    <small>#{winner.position}</small>
                    <strong>{winner.buyer}</strong>
                    <b>Numero {winner.number}</b>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="raffle-numbers admin-form-section">
            <div className="admin-section-title">
              <span>Numeros del sorteo</span>
              <small>Escribi el nombre de la persona para que ese numero participe.</small>
            </div>

            <div className="raffle-number-grid">
              {numbers.map((number) => {
                const buyer = raffle.entries[getNumberKey(number)] || '';

                return (
                  <label
                    className={`raffle-number-card ${buyer.trim() ? 'is-sold' : ''}`}
                    key={number}
                  >
                    <strong>{number}</strong>
                    <input
                      type="text"
                      value={buyer}
                      onChange={(event) => updateBuyer(number, event.target.value)}
                      placeholder="Nombre"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {message && <p className={`admin-message ${messageType}`}>{message}</p>}
    </section>
  );
}

export default AdminRaffles;
