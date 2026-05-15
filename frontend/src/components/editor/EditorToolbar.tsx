import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode } from '@lexical/rich-text';
import styles from './EditorToolbar.module.css';

interface EditorToolbarProps {
  disabled?: boolean;
}

export function EditorToolbar({ disabled }: EditorToolbarProps) {
  const [editor] = useLexicalComposerContext();

  const format = (type: 'bold' | 'italic') => {
    if (disabled) return;
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  };

  const bulletList = () => {
    if (disabled) return;
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const numberedList = () => {
    if (disabled) return;
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const heading = () => {
    if (disabled) return;
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode('h2'));
      }
    });
  };

  const paragraph = () => {
    if (disabled) return;
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  return (
    <div className={styles.toolbar}>
      <button type="button" className={styles.toolBtn} disabled={disabled} onClick={() => format('bold')}>
        Ж
      </button>
      <button type="button" className={styles.toolBtn} disabled={disabled} onClick={() => format('italic')}>
        К
      </button>
      <button type="button" className={styles.toolBtn} disabled={disabled} onClick={heading}>
        H2
      </button>
      <button type="button" className={styles.toolBtn} disabled={disabled} onClick={paragraph}>
        P
      </button>
      <button type="button" className={styles.toolBtn} disabled={disabled} onClick={bulletList}>
        • Список
      </button>
      <button type="button" className={styles.toolBtn} disabled={disabled} onClick={numberedList}>
        1. Список
      </button>
    </div>
  );
}
