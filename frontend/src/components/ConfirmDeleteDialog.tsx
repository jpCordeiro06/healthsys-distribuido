import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api'
import { Icon } from './Icon'

interface Props {
  kind: 'usuário' | 'paciente'
  recordName: string
  recordDetail: string
  onDelete: () => Promise<void>
  onDeleted: () => void
  onClose: () => void
  onExpired: () => void
}

export function ConfirmDeleteDialog({
  kind,
  recordName,
  recordDetail,
  onDelete,
  onDeleted,
  onClose,
  onExpired,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element?.showModal()
    cancel.current?.focus()
    return () => {
      element?.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus()
      } else {
        document.getElementById('main-content')?.focus()
      }
    }
  }, [])

  async function confirm() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await onDelete()
      onDeleted()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onExpired()
        return
      }
      setError(error instanceof ApiError ? error.message : 'Não foi possível excluir. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      className="record-dialog delete-dialog"
      aria-labelledby="delete-title"
      aria-describedby="delete-description delete-record"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <div className="dialog-header">
        <span className="dialog-icon">
          <Icon name="trash" size={23} />
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Fechar confirmação de exclusão"
          onClick={onClose}
          disabled={busy}
        >
          <Icon name="close" />
        </button>
      </div>
      <h2 id="delete-title">Excluir {kind}</h2>
      <p className="muted" id="delete-description">
        Confirme a exclusão deste {kind}. Esta ação é permanente.
      </p>
      <div className="delete-record" id="delete-record">
        <strong>{recordName}</strong>
        <span>{recordDetail}</span>
      </div>
      {error && <div className="error-box" role="alert">{error}</div>}
      <div className="dialog-footer">
        <button ref={cancel} type="button" className="button secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
        <button type="button" className="button danger" onClick={() => void confirm()} disabled={busy}>
          {busy ? <span className="spinner" /> : <Icon name="trash" size={17} />}
          {busy ? 'Excluindo…' : `Excluir ${kind}`}
        </button>
      </div>
    </dialog>
  )
}
