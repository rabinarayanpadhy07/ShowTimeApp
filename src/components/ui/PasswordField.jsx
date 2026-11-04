import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

import { TextField } from './FormControls'

export function PasswordField(props) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <TextField type={visible ? 'text' : 'password'} icon={Lock} inputClassName="pr-12" {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute top-[1.875rem] right-1.5 inline-flex size-8 items-center justify-center rounded-md text-ink-muted hover:text-ink"
      >
        {visible ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
      </button>
    </div>
  )
}
