import { useId } from 'react';
import { Modal } from './Modal.jsx';
import { Switch } from './Switch.jsx';
import { TEXT_SIZES, TTS_RATES } from '../preferences.js';
import {
  AudioLines,
  BookOpen,
  Captions,
  Check,
  Contrast,
  Droplet,
  Eye,
  Keyboard,
  Link,
  Moon,
  MousePointer2,
  Palette,
  Rows3,
  Scan,
  Shapes,
  ShieldCheck,
  Sparkles,
  Sun,
  Type,
} from './icons.jsx';

const SIZE_LABELS = { 100: 'Normal', 112: 'Grande', 125: 'Muy grande', 150: 'Extra grande' };
const rateText = (rate) => `${String(rate).replace('.', ',')} veces`;

function Segmented({ name, options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map(([optionValue, label, detail]) => (
        <label key={optionValue} className={value === optionValue ? 'selected' : ''}>
          <input
            type="radio"
            name={name}
            checked={value === optionValue}
            onChange={() => onChange(optionValue)}
          />
          <span>{label}</span>
          {detail && <small>{detail}</small>}
        </label>
      ))}
    </div>
  );
}

export function Preferences({ prefs, update, reset, onClose, systemReduced, speechSupported }) {
  const rateId = useId();
  const rateIndex = Math.max(0, TTS_RATES.indexOf(prefs.ttsRate));
  return (
    <Modal
      title="Preferencias de accesibilidad"
      subtitle="Elige lo que te ayuda a aprender mejor."
      onClose={onClose}
      drawer
    >
      <div className="drawer-content">
        <div className="save-note">
          <ShieldCheck size={17} />
          <span>Se guardan en este navegador automáticamente.</span>
        </div>
        <fieldset>
          <legend>
            <Palette size={18} /> Apariencia
          </legend>
          <div className="theme-options">
            {[
              ['light', 'Claro', Sun],
              ['dark', 'Oscuro', Moon],
              ['contrast', 'Alto contraste', Contrast],
            ].map(([value, label, Icon]) => (
              <label
                className={`theme-option ${prefs.theme === value ? 'selected' : ''}`}
                key={value}
              >
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={prefs.theme === value}
                  onChange={() => update('theme', value)}
                />
                <span className={`theme-preview preview-${value}`}>
                  <span />
                  <span />
                  <span />
                </span>
                <span>
                  <Icon size={16} />
                  {label}
                </span>
                {prefs.theme === value && <Check size={15} className="choice-check" />}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <Droplet size={18} /> Color
          </legend>
          <Segmented
            name="saturation"
            value={prefs.saturation}
            onChange={(v) => update('saturation', v)}
            options={[
              ['normal', 'Normal'],
              ['low', 'Suave', 'menos saturado'],
              ['gray', 'Grises', 'sin color'],
            ]}
          />
        </fieldset>
        <fieldset>
          <legend>
            <Type size={18} /> Tamaño del texto
          </legend>
          <Segmented
            name="text-size"
            value={prefs.size}
            onChange={(v) => update('size', v)}
            options={TEXT_SIZES.map((size) => [size, SIZE_LABELS[size], `${size}%`])}
          />
        </fieldset>
        <div className="reading-preview">
          <span>VISTA PREVIA</span>
          <h3>Aprender también es descubrir.</h3>
          <p>Cada persona tiene su propio ritmo. Este espacio se adapta al tuyo.</p>
        </div>
        <fieldset className="switches">
          <legend>
            <BookOpen size={18} /> Lectura
          </legend>
          <Switch
            icon={Type}
            label="Más espacio al leer"
            description="Aumenta el espacio entre letras y líneas."
            checked={prefs.spacing}
            onChange={(v) => update('spacing', v)}
          />
          <Switch
            icon={Type}
            label="Letra más legible"
            description="Usa una tipografía con letras más fáciles de distinguir."
            checked={prefs.legibleFont}
            onChange={(v) => update('legibleFont', v)}
          />
          <Switch
            icon={Rows3}
            label="Guía de lectura"
            description="Resalta la línea donde está el puntero o el foco y oscurece el resto."
            checked={prefs.readingGuide}
            onChange={(v) => update('readingGuide', v)}
          />
          <Switch
            icon={Scan}
            label="Modo lectura"
            description="Oculta menús y adornos. El botón «Salir del modo lectura» queda siempre visible."
            checked={prefs.readingMode}
            onChange={(v) => update('readingMode', v)}
          />
        </fieldset>
        <fieldset className="switches">
          <legend>
            <AudioLines size={18} /> Voz y multimedia
          </legend>
          <Switch
            icon={AudioLines}
            label="Lectura en voz alta"
            description={
              speechSupported
                ? 'Muestra un reproductor para escuchar el texto seleccionado o la página.'
                : 'Este navegador no ofrece voz sintética.'
            }
            checked={prefs.tts}
            onChange={(v) => update('tts', v)}
          />
          <div className="range-field">
            <label htmlFor={rateId}>Velocidad de lectura</label>
            <input
              id={rateId}
              type="range"
              min={0}
              max={TTS_RATES.length - 1}
              step={1}
              value={rateIndex}
              aria-valuetext={rateText(prefs.ttsRate)}
              onChange={(e) => update('ttsRate', TTS_RATES[Number(e.target.value)])}
            />
            <output htmlFor={rateId}>{String(prefs.ttsRate).replace('.', ',')}×</output>
          </div>
          <Switch
            icon={Captions}
            label="Subtítulos grandes"
            description="Aumenta el tamaño de los subtítulos en directo."
            checked={prefs.captionsLarge}
            onChange={(v) => update('captionsLarge', v)}
          />
          <Switch
            icon={Shapes}
            label="Pictogramas por defecto"
            description="Muestra los pictogramas en los materiales que los tengan."
            checked={prefs.pictograms}
            onChange={(v) => update('pictograms', v)}
          />
        </fieldset>
        <fieldset className="switches">
          <legend>
            <Keyboard size={18} /> Navegación y movimiento
          </legend>
          <Switch
            icon={Eye}
            label="Foco más visible"
            description="Hace más grueso el borde que indica dónde estás al usar el teclado."
            checked={prefs.strongFocus}
            onChange={(v) => update('strongFocus', v)}
          />
          <Switch
            icon={Link}
            label="Resaltar enlaces"
            description="Subraya los enlaces y botones de texto."
            checked={prefs.underlineLinks}
            onChange={(v) => update('underlineLinks', v)}
          />
          <Switch
            icon={MousePointer2}
            label="Cursor grande"
            description="Aumenta el tamaño del puntero del ratón."
            checked={prefs.bigCursor}
            onChange={(v) => update('bigCursor', v)}
          />
          <Switch
            icon={Sparkles}
            label="Reducir movimiento"
            description={
              systemReduced
                ? 'Tu sistema ya solicita reducir el movimiento.'
                : 'Evita animaciones y transiciones.'
            }
            checked={prefs.reducedMotion}
            onChange={(v) => update('reducedMotion', v)}
          />
          <Switch
            icon={BookOpen}
            label="Modo concentración"
            description="Oculta las ilustraciones decorativas."
            checked={prefs.focus}
            onChange={(v) => update('focus', v)}
          />
        </fieldset>
        <div className="preference-tip">
          <Keyboard size={20} />
          <p>
            También puedes usar <kbd>Tab</kbd> para recorrer los controles y <kbd>Esc</kbd> para
            cerrar.
          </p>
        </div>
      </div>
      <div className="drawer-footer">
        <button className="text-button" onClick={reset}>
          Restablecer
        </button>
        <button className="button primary" onClick={onClose}>
          Listo <Check size={17} />
        </button>
      </div>
    </Modal>
  );
}
