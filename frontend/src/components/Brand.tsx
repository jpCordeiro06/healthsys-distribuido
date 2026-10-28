import { Icon } from './Icon'

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <Icon name="cross" size={23} />
      </span>
      <span>
        HealthSys<span className="brand-dot">.</span>
      </span>
    </div>
  )
}
