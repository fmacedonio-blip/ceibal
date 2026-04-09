import { useState } from 'react';
import { HiXMark, HiArrowLeft, HiBookOpen, HiPencil } from 'react-icons/hi2';

type TaskType = 'lectura' | 'escritura';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
}

const TYPE_CARDS: { type: TaskType; title: string; description: string }[] = [
  {
    type: 'lectura',
    title: 'Lectura',
    description: 'Actividades enfocadas en comprensión lectora, análisis de textos y vocabulario.',
  },
  {
    type: 'escritura',
    title: 'Escritura',
    description: 'Ejercicios de redacción creativa, gramática aplicada y expresión escrita.',
  },
];

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[1, 2].map((s) => (
        <div
          key={s}
          style={{
            width: 24, height: 4, borderRadius: 2,
            background: s <= step ? '#00b89c' : '#e5e7eb',
            transition: 'background 0.2s',
          }}
        />
      ))}
    </div>
  );
}

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.08em' }}>{label}</span>
      {optional && (
        <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', background: '#f3f4f6', borderRadius: 4, padding: '2px 6px', letterSpacing: '0.04em' }}>
          OPCIONAL
        </span>
      )}
    </div>
  );
}

export function NewTaskModal({ isOpen, onClose, courseName }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<TaskType | null>(null);
  const [title, setTitle] = useState('');
  const [mainText, setMainText] = useState('');
  const [criteria, setCriteria] = useState('');

  if (!isOpen) return null;

  function handleClose() {
    onClose();
    // Reset after closing animation (instant for now)
    setTimeout(() => {
      setStep(1);
      setSelectedType(null);
      setTitle('');
      setMainText('');
      setCriteria('');
    }, 150);
  }

  function handleNext() {
    if (selectedType) setStep(2);
  }

  function handleBack() {
    setStep(1);
  }

  function handleCreate() {
    handleClose();
  }

  const maxChars = selectedType === 'lectura' ? 5000 : 2000;
  const mainLabel = selectedType === 'lectura' ? 'TEXTO' : 'CONSIGNA';
  const canCreate = title.trim().length > 0 && mainText.trim().length > 0;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #d1d5db', fontSize: 14, color: '#111827',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 640, maxHeight: '90vh',
        background: '#fff', borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        zIndex: 101,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
              Nueva Tarea{selectedType && step === 2 ? ` — ${selectedType === 'lectura' ? 'Lectura' : 'Escritura'}` : ''}
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>
              {step === 1 ? 'Paso 1 de 2 · Seleccioná el tipo de actividad' : `Paso 2 de 2 · Curso: ${courseName}`}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex', borderRadius: 6 }}
          >
            <HiXMark size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
          {step === 1 ? (
            /* Paso 1: selección de tipo */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {TYPE_CARDS.map((card) => {
                const isSelected = selectedType === card.type;
                return (
                  <button
                    key={card.type}
                    onClick={() => setSelectedType(card.type)}
                    style={{
                      background: isSelected ? '#f0fdfa' : '#f9fafb',
                      border: isSelected ? '2px solid #00b89c' : '2px solid #e5e7eb',
                      borderRadius: 12, padding: '28px 20px',
                      cursor: 'pointer', textAlign: 'center',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{ marginBottom: 12, color: isSelected ? '#00b89c' : '#9ca3af' }}>
                    {card.type === 'lectura' ? <HiBookOpen size={36} /> : <HiPencil size={36} />}
                  </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{card.title}</p>
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{card.description}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Paso 2: campos de la tarea */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Título */}
              <div>
                <FieldLabel label="TÍTULO" />
                <input
                  type="text"
                  placeholder={`Ej: ${selectedType === 'lectura' ? 'El zorro y la luna' : 'Mi aventura espacial'}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Campo principal */}
              <div>
                <FieldLabel label={mainLabel} />
                <div style={{ position: 'relative' }}>
                  <textarea
                    placeholder={selectedType === 'lectura'
                      ? 'Pegá aquí el material de lectura...'
                      : 'Describí detalladamente lo que el estudiante debe escribir...'}
                    value={mainText}
                    onChange={(e) => setMainText(e.target.value.slice(0, maxChars))}
                    rows={8}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 160 }}
                  />
                  <span style={{
                    position: 'absolute', bottom: 10, right: 12,
                    fontSize: 12, color: '#9ca3af',
                  }}>
                    {mainText.length} / {maxChars.toLocaleString()} characters
                  </span>
                </div>
              </div>

              {/* Criterio de evaluación */}
              <div>
                <FieldLabel label="CRITERIO DE EVALUACIÓN" optional />
                <textarea
                  placeholder={selectedType === 'lectura'
                    ? 'Ej: Fluidez, Comprensión de vocabulario, Entonación...'
                    : 'Ej: Se evaluará la coherencia, ortografía y uso de conectores...'}
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {/* Izquierda */}
          {step === 1 ? (
            <button onClick={handleClose} style={{ background: 'none', border: 'none', fontSize: 14, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancelar
            </button>
          ) : (
            <button onClick={handleBack} style={{ background: 'none', border: 'none', fontSize: 14, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <HiArrowLeft size={14} /> Volver
            </button>
          )}

          {/* Centro: indicador */}
          <StepIndicator step={step} />

          {/* Derecha */}
          {step === 1 ? (
            <button
              onClick={handleNext}
              disabled={!selectedType}
              style={{
                background: selectedType ? '#00b89c' : '#d1d5db',
                color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 20px',
                fontSize: 14, fontWeight: 600,
                cursor: selectedType ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
              }}
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              style={{
                background: canCreate ? '#00b89c' : '#d1d5db',
                color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 20px',
                fontSize: 14, fontWeight: 600,
                cursor: canCreate ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              Crear tarea ✓
            </button>
          )}
        </div>
      </div>
    </>
  );
}
