import fs from 'fs';

const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Inserir o estado currentPos e useEffect do radar
// Vamos encontrar a assinatura da funçao DashboardNewRecordView e colocar logo apos a declaração de state de erro
const targetState = `  const [error, setError] = useState('');`;
const newState = `  const [error, setError] = useState('');
  const [currentPos, setCurrentPos] = useState<{ latitude: number, longitude: number } | null>(null);

  useEffect(() => {
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentPos({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => console.log('Radar GPS error:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);`;
code = code.replace(targetState, newState);

// 2. Refatorar o handleSubmit completo
// Usaremos regex para capturar a função inteira handleSubmit do DashboardNewRecordView
const submitRegex = /const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?maximumAge: 0\s*\}\);\s*\};/;
const newSubmit = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo seu navegador');
      setLoading(false);
      return;
    }

    const saveRecord = async (lat: number, lon: number) => {
      try {
        const res = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            latitude: lat,
            longitude: lon,
            user_id: user.id
          })
        });

        if (res.ok) {
          onSuccess();
        } else {
          setError('Erro ao salvar registro');
        }
      } catch (err) {
        setError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    };

    if (currentPos) {
      await saveRecord(currentPos.latitude, currentPos.longitude);
    } else {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        await saveRecord(latitude, longitude);
      }, (err) => {
        let msg = 'Erro ao capturar geolocalização.';
        if (err.code === err.PERMISSION_DENIED) msg = 'Permissão de geolocalização negada. Por favor, habilite o acesso.';
        else if (err.code === err.POSITION_UNAVAILABLE) msg = 'Posição indisponível. Verifique seu GPS.';
        else if (err.code === err.TIMEOUT) msg = 'Tempo esgotado ao capturar localização. Tente novamente.';
        
        setError(msg);
        setLoading(false);
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000
      });
    }
  };`;

code = code.replace(submitRegex, newSubmit);

fs.writeFileSync(file, code);
console.log('GPS Watch Radar applied!');
