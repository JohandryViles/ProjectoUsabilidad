import { useId, useState } from 'react';
import { useApiMode } from '../api/client.js';
import { materials } from '../data/materials.js';
import { Captions, ImageIcon, ScrollText, Shapes, Wand2 } from '../components/icons.jsx';
import { TextField } from './common.jsx';
import { AltTextPanel } from './AltTextPanel.jsx';
import { LiveCaptions } from './LiveCaptions.jsx';
import { PictogramPanel } from './PictogramView.jsx';
import { PlainLanguagePanel } from './PlainLanguagePanel.jsx';
import { SummaryGlossaryPanel } from './SummaryGlossaryPanel.jsx';

const MODE_TEXT = {
  checking: 'Comprobando la conexión con el servidor…',
  claude: 'Conectado a la IA (Claude). Las sugerencias son reales y deben revisarse.',
  demo: 'Modo demo: el servidor responde con ejemplos sin usar IA. Sirve para probar los flujos.',
  offline: 'El servidor no está disponible. Inícialo con «npm run dev» para usar las herramientas.',
};

function ToolCard({ icon: Icon, title, description, children }) {
  const id = useId();
  return (
    <section className="tool-card" aria-labelledby={id}>
      <div className="tool-heading">
        <span className="tool-icon">
          <Icon size={20} />
        </span>
        <div>
          <h2 id={id}>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/** Vista del docente (U2) para las funciones del integrante B. */
export function ToolsPage({ announce }) {
  const mode = useApiMode();
  const selectId = useId();
  const [materialId, setMaterialId] = useState(materials[0].id);
  const [text, setText] = useState('');
  const material = materials.find((m) => m.id === materialId);

  return (
    <div className="tools-page">
      <p className={`mode-banner mode-${mode}`} role="status">
        {MODE_TEXT[mode]}
      </p>
      <section className="tool-card" aria-labelledby={`${selectId}-src`}>
        <h2 id={`${selectId}-src`}>Material de la clase</h2>
        <div className="field">
          <label htmlFor={selectId}>Material al que se publican las adaptaciones</label>
          <select id={selectId} value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} · {m.subject}
              </option>
            ))}
          </select>
        </div>
        <TextField
          label="Texto de la clase"
          hint="Pega el contenido o usa la transcripción. El resumen, el glosario y los pictogramas parten de este texto."
          multiline
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </section>

      <ToolCard
        icon={Captions}
        title="Subtítulos en directo y transcripción"
        description="Captura la voz de la clase, corrige la transcripción y descárgala en VTT o TXT."
      >
        <LiveCaptions announce={announce} materialId={materialId} onUseAsText={setText} />
      </ToolCard>
      <ToolCard
        icon={ScrollText}
        title="Resumen y glosario"
        description="Sugerencias en lenguaje claro que apruebas antes de que las vean los estudiantes."
      >
        <SummaryGlossaryPanel
          text={text}
          title={material?.title}
          materialId={materialId}
          announce={announce}
        />
      </ToolCard>
      <ToolCard
        icon={Wand2}
        title="Explicar más fácil"
        description="Convierte un párrafo a lectura fácil sin perder el original."
      >
        <PlainLanguagePanel sourceText={text} materialId={materialId} announce={announce} />
      </ToolCard>
      <ToolCard
        icon={ImageIcon}
        title="Descripción de imágenes"
        description="Texto alternativo sugerido para fotos, gráficos y diagramas."
      >
        <AltTextPanel materialId={materialId} announce={announce} />
      </ToolCard>
      <ToolCard
        icon={Shapes}
        title="Pictogramas"
        description="Apoyo visual con pictogramas de ARASAAC para la lectura."
      >
        <PictogramPanel sourceText={text} materialId={materialId} announce={announce} />
      </ToolCard>
    </div>
  );
}
