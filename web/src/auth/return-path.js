export function safeReturnPath(value) {
  return value === '/welcome' ? '/welcome' : '/account';
}
