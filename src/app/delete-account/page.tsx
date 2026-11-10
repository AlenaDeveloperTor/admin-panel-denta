'use client';

import { useState } from 'react';

/** Шаги на странице удаления аккаунта */
type Step = 'phone' | 'code' | 'confirm' | 'done' | 'not_found';

const API = '/api/patient-auth';

export default function DeleteAccountPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('+7');
  const [sessionId, setSessionId] = useState('');
  const [code, setCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Шаг 1: Запрос кода ────────────────────────────────────────────────
  const handleRequestCode = async () => {
    setError(null);
    if (phone.replace(/\D/g, '').length < 11) {
      setError('Введите корректный номер телефона');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_code', phone: phone.replace(/\s/g, '') }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.detail ?? 'Ошибка при отправке кода. Проверьте номер телефона.');
        return;
      }
      // Если бэкенд просит перейти в бота (need_redirect), значит такого пользователя
      // в системе нет (он не привязан к боту / удалён). Регистрировать его для удаления бессмысленно.
      if (data.status === 'need_redirect') {
        setStep('not_found');
        return;
      }
      setSessionId(data.session_id ?? '');
      setStep('code');
    } catch {
      setError('Не удалось подключиться к серверу. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // ── Шаг 2: Подтверждение кода ─────────────────────────────────────────
  const handleVerifyCode = async () => {
    setError(null);
    if (code.replace(/\D/g, '').length < 4) {
      setError('Введите 4-значный код');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_code',
          session_id: sessionId,
          code: code.replace(/\D/g, ''),
          device_id: 'web-delete-account',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.detail ?? 'Неверный код. Попробуйте ещё раз.');
        return;
      }
      setAccessToken(data.access_token ?? '');
      setStep('confirm');
    } catch {
      setError('Не удалось подтвердить код. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // ── Шаг 3: Финальное удаление ─────────────────────────────────────────
  const handleDelete = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-patient-token': accessToken,
        },
        body: JSON.stringify({ action: 'delete_account' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.detail ?? 'Не удалось удалить аккаунт. Попробуйте позже.');
        return;
      }
      setStep('done');
    } catch {
      setError('Ошибка соединения. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // ── Форматирование телефона ────────────────────────────────────────────
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '+7';
    if (digits.length > 1) {
      const local = digits.slice(1, 11);
      if (local.length > 0) formatted += ' ' + local.slice(0, 3);
      if (local.length > 3) formatted += ' ' + local.slice(3, 6);
      if (local.length > 6) formatted += '-' + local.slice(6, 8);
      if (local.length > 8) formatted += '-' + local.slice(8, 10);
    }
    setPhone(formatted);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #AAC6EE 0%, #D0C8B5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: '"Montserrat", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: '36px 32px',
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 8px 32px rgba(23,41,51,0.12)',
        }}
      >
        {/* Лого / Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              background: 'linear-gradient(135deg, #AAC6EE 0%, #D0C8B5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 28,
            }}
          >
            🦷
          </div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#172933',
              margin: 0,
            }}
          >
            Удаление аккаунта
          </h1>
          <p
            style={{
              fontSize: 14,
              color: '#6B7A8F',
              marginTop: 8,
              marginBottom: 0,
              lineHeight: 1.5,
            }}
          >
            labsmilê · стоматология
          </p>
        </div>

        {/* ── Шаг 1: Телефон ───────────────────────────────────────── */}
        {step === 'phone' && (
          <>
            <p style={{ fontSize: 14, color: '#6B7A8F', marginBottom: 20, lineHeight: 1.6 }}>
              Введите номер телефона, привязанный к вашему аккаунту. Мы отправим код подтверждения
              через бота MAX.
            </p>
            <label style={labelStyle}>Номер телефона</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              style={inputStyle}
              placeholder="+7 999 123-45-67"
              autoComplete="tel"
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button
              onClick={handleRequestCode}
              disabled={loading}
              style={btnStyle(loading)}
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </>
        )}

        {/* ── Шаг 2: Код ───────────────────────────────────────────── */}
        {step === 'code' && (
          <>
            <p style={{ fontSize: 14, color: '#6B7A8F', marginBottom: 20, lineHeight: 1.6 }}>
              Введите 4-значный код из чата с ботом MAX для номера{' '}
              <strong style={{ color: '#172933' }}>{phone}</strong>.
            </p>
            <label style={labelStyle}>Код подтверждения</label>
            <input
              type="tel"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              style={{ ...inputStyle, letterSpacing: '0.3em', textAlign: 'center', fontSize: 22 }}
              placeholder="0000"
              maxLength={4}
              autoComplete="one-time-code"
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button
              onClick={handleVerifyCode}
              disabled={loading}
              style={btnStyle(loading)}
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>
            <button onClick={() => { setStep('phone'); setError(null); setCode(''); }} style={ghostBtnStyle}>
              ← Изменить номер
            </button>
          </>
        )}

        {/* ── Шаг 3: Подтверждение удаления ───────────────────────── */}
        {step === 'confirm' && (
          <>
            <div
              style={{
                background: '#FFF3F3',
                border: '1px solid #FFCDD2',
                borderRadius: 12,
                padding: '16px',
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  color: '#B71C1C',
                  margin: 0,
                  lineHeight: 1.6,
                  fontWeight: 600,
                }}
              >
                ⚠️ Это действие необратимо
              </p>
              <p style={{ fontSize: 13, color: '#D32F2F', margin: '8px 0 0', lineHeight: 1.5 }}>
                Будут безвозвратно удалены: ваш профиль, история визитов, бонусный баланс и все
                связанные данные.
              </p>
            </div>
            {error && <p style={errorStyle}>{error}</p>}
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{ ...btnStyle(loading), background: loading ? '#e57373' : '#D32F2F' }}
            >
              {loading ? 'Удаление...' : 'Да, удалить мой аккаунт'}
            </button>
            <button
              onClick={() => { setStep('phone'); setError(null); setCode(''); setAccessToken(''); }}
              style={ghostBtnStyle}
            >
              Отмена
            </button>
          </>
        )}

        {/* ── Шаг: Аккаунт не найден / уже удален ─────────────────── */}
        {step === 'not_found' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🛡️</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#172933', marginBottom: 12 }}>
              Аккаунт не найден
            </h2>
            <p style={{ fontSize: 14, color: '#6B7A8F', lineHeight: 1.6, margin: '0 0 24px' }}>
              Аккаунт с номером <strong style={{ color: '#172933' }}>{phone}</strong> не зарегистрирован
              в приложении или уже был удалён.
              <br />
              <br />
              Ваши персональные данные отсутствуют в базе клиники. Дополнительных действий по удалению не требуется.
            </p>
            <button
              onClick={() => {
                setStep('phone');
                setError(null);
                setCode('');
              }}
              style={ghostBtnStyle}
            >
              Проверить другой номер
            </button>
          </div>
        )}

        {/* ── Шаг 4: Успех ─────────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#172933', marginBottom: 12 }}>
              Аккаунт удалён
            </h2>
            <p style={{ fontSize: 14, color: '#6B7A8F', lineHeight: 1.6, margin: 0 }}>
              Ваш аккаунт и все связанные с ним данные были безвозвратно удалены.
              <br />
              <br />
              Спасибо, что пользовались приложением labsmilê. Мы всегда рады видеть вас снова.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Стили (inline для изолированной публичной страницы без adminки) ──────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: '#6B7A8F',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 16,
  borderRadius: 12,
  border: '1px solid #DDE4EF',
  outline: 'none',
  color: '#172933',
  background: '#F5F8FC',
  boxSizing: 'border-box',
  marginBottom: 16,
  fontFamily: 'inherit',
};

const btnStyle = (loading: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '14px',
  fontSize: 15,
  fontWeight: 600,
  borderRadius: 50,
  border: 'none',
  background: loading ? '#8bb0e4' : '#172933',
  color: '#fff',
  cursor: loading ? 'not-allowed' : 'pointer',
  marginBottom: 10,
  fontFamily: 'inherit',
  transition: 'background 0.2s',
});

const ghostBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  fontSize: 14,
  borderRadius: 50,
  border: '1px solid #DDE4EF',
  background: 'transparent',
  color: '#6B7A8F',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const errorStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#D32F2F',
  marginBottom: 12,
  textAlign: 'center',
};

