import type { ChangeEvent, ComponentProps, JSX } from 'react';

import { Textarea } from '@/components/ui/textarea';

interface StringListTextareaProps extends Omit<
  ComponentProps<typeof Textarea>,
  'value' | 'onChange'
> {
  readonly value: string[];
  readonly onChange: (value: string[]) => void;
}

// A string[] field (DepositSettings/WithdrawalSettings' paymentMethods,
// HomepageSettings' bannerImages) edited as one line per entry. Deliberately does
// NOT trim/filter blank lines on every keystroke - doing so would fight the
// cursor the instant a user presses Enter to start a new line. Callers clean the
// array (trim + drop blanks) once, at submit time.
const StringListTextarea = ({
  value,
  onChange,
  ...props
}: StringListTextareaProps): JSX.Element => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onChange(event.target.value.split('\n'));
  };

  return <Textarea value={value.join('\n')} onChange={handleChange} {...props} />;
};

export default StringListTextarea;
