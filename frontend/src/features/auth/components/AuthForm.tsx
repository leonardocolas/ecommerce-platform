import { useState, type FormEvent } from 'react'

export type AuthFieldName = 'username' | 'email' | 'password' | 'confirmPassword'

export interface AuthField {
  name: AuthFieldName
  label: string
  placeholder: string
  type: 'text' | 'email' | 'password'
  autoComplete: string
  helperText?: string
}

interface AuthFormProps {
  onSubmit: (formData: FormData) => Promise<void>
  submitLabel: string
  error?: string | null
  fields: AuthField[]
}

function getMinLength(fieldName: AuthFieldName) {
  if (fieldName === 'password' || fieldName === 'confirmPassword') {
    return 8
  }

  return undefined
}

export default function AuthForm({ onSubmit, submitLabel, error, fields }: AuthFormProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      await onSubmit(formData)
    } catch {
      // El padre ya se encarga de mostrar el error.
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="mb-2 block text-sm font-medium text-slate-700">
            {field.label}
          </label>
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            required
            minLength={getMinLength(field.name)}
            autoComplete={field.autoComplete}
            autoCapitalize="none"
            spellCheck={false}
            className="block w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
            placeholder={field.placeholder}
          />
          {field.helperText ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">{field.helperText}</p>
          ) : null}
        </div>
      ))}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-white"
      >
        {loading ? 'Procesando...' : submitLabel}
      </button>
    </form>
  )
}
