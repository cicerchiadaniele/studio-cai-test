import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Info,
  AlertTriangle,
  Home,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
} from "lucide-react";

// Helpers
const cn = (...cls) => cls.filter(Boolean).join(" ");

// Validazione Codice Fiscale italiano
const validateCF = (cf) => {
  if (!cf) return false;
  const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
  return cfRegex.test(cf.toUpperCase());
};

// Validazione Email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validazione Telefono
const validatePhone = (phone) => {
  const phoneRegex = /^[0-9\s\-\+\(\)]{8,}$/;
  return phoneRegex.test(phone);
};

export default function ModuloDetrazioniFiscali() {
  const [formData, setFormData] = useState({
    condominio: '',
    civico: '',
    tipoImmobile: '',
    interno: '',
    sezione: '',
    foglio: '',
    particella: '',
    subalterno: '',
    categoria: '',
    cognome: '',
    nome: '',
    dataNascita: '',
    luogoNascita: '',
    codiceFiscale: '',
    quotaPossesso: '',
    abitazionePrincipale: false,
    detrazione50: false,
    email: '',
    telefono: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Controlla se è l'ultima settimana dell'anno
  const isEndOfYear = () => {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();
    return month === 11 && day >= 15; // Dicembre dal 15 in poi
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const validateField = (field, value) => {
    let error = '';

    switch(field) {
      case 'condominio':
        if (!value.trim()) error = 'Campo obbligatorio';
        break;
      case 'foglio':
      case 'particella':
      case 'subalterno':
        if (!value.trim()) error = 'Dato catastale obbligatorio';
        break;
      case 'categoria':
        if (!value.trim()) error = 'Categoria catastale obbligatoria';
        break;
      case 'cognome':
      case 'nome':
        if (!value.trim()) error = 'Campo obbligatorio';
        break;
      case 'codiceFiscale':
        if (!value.trim()) {
          error = 'Codice fiscale obbligatorio';
        } else if (!validateCF(value)) {
          error = 'Codice fiscale non valido';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email obbligatoria';
        } else if (!validateEmail(value)) {
          error = 'Email non valida';
        }
        break;
      case 'telefono':
        if (!value.trim()) {
          error = 'Telefono obbligatorio';
        } else if (!validatePhone(value)) {
          error = 'Numero di telefono non valido';
        }
        break;
      case 'quotaPossesso':
        if (value && (isNaN(value) || value <= 0 || value > 100)) {
          error = 'La quota deve essere tra 1 e 100';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const validateForm = () => {
    const requiredFields = [
      'condominio', 'foglio', 'particella', 'subalterno', 'categoria',
      'cognome', 'nome', 'codiceFiscale', 'email', 'telefono'
    ];

    let isValid = true;
    requiredFields.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });

    if (formData.detrazione50 && !formData.abitazionePrincipale) {
      setErrors(prev => ({ 
        ...prev, 
        abitazionePrincipale: 'Per richiedere la detrazione al 50% è necessario che l\'immobile sia abitazione principale' 
      }));
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allFields = Object.keys(formData);
    const allTouched = {};
    allFields.forEach(field => allTouched[field] = true);
    setTouched(allTouched);

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        dataInvio: new Date().toISOString(),
        aliquotaApplicabile: formData.detrazione50 && formData.abitazionePrincipale ? '50%' : '36%',
        timestamp: new Date().toLocaleString('it-IT')
      };

      console.log('Dati da inviare:', dataToSend);
      
      // Invio dati al webhook Make.com
      const response = await fetch('https://hook.eu1.make.com/hp2vnjhmqpmvb7ju9abtp5f3vg8go3a1', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      console.log('Dati inviati con successo');
      
      setSubmitSuccess(true);
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Errore invio:', error);
      alert('Errore durante l\'invio del modulo. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Modulo Inviato con Successo!</h2>
          <p className="text-gray-600 mb-6">
            Riceverai una copia dell'autocertificazione all'indirizzo email indicato.
          </p>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-sm text-green-800">
              La tua richiesta è stata registrata correttamente. L'amministrazione procederà con l'inserimento dei dati nella comunicazione all'Agenzia delle Entrate.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8 mb-8 rounded-2xl shadow-xl"
      >
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Modulo Detrazioni Fiscali
          </h1>
          <p className="text-lg opacity-90">
            Aliquote Differenziate per Abitazione Principale
          </p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        {/* Avviso scadenza */}
        <AnimatePresence>
          {isEndOfYear() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">
                    ⏰ SCADENZA IMMINENTE: 31 DICEMBRE
                  </h3>
                  <p className="text-sm text-amber-800">
                    La comunicazione deve essere presentata entro il 31 dicembre per beneficiare dell'aliquota maggiorata del 50% nelle future dichiarazioni.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info box generale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-5 mb-8"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Informazioni Importanti
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li><strong>Aliquota 50%:</strong> applicabile se l'intervento è sostenuto dal proprietario o titolare di diritto reale e l'unità immobiliare è destinata ad abitazione principale.</li>
                <li><strong>Aliquota 36%:</strong> applicabile in tutti gli altri casi.</li>
                <li><strong>Scadenza:</strong> entro il 31 dicembre di ogni anno.</li>
                <li><strong>Effetti mancata comunicazione:</strong> senza comunicazione entro il 31 dicembre, non sarà applicata l'aliquota maggiorata del 50% nella dichiarazione precompilata.</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit} 
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Sezione Condominio */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-500 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Dati Condominio
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condominio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.condominio}
                  onChange={(e) => handleChange('condominio', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500 focus:border-purple-500",
                    touched.condominio && errors.condominio ? 'border-red-500' : 'border-gray-200'
                  )}
                  placeholder="Es: Via Roma, Condominio Rossi"
                />
                {touched.condominio && errors.condominio && (
                  <p className="text-red-500 text-sm mt-1">{errors.condominio}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Civico
                </label>
                <input
                  type="text"
                  value={formData.civico}
                  onChange={(e) => handleChange('civico', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 transition-all focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="N."
                />
              </div>
            </div>
          </div>

          {/* Sezione Immobile */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-500 flex items-center gap-2">
              <Home className="w-6 h-6" />
              Dati Immobile
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Immobile
                </label>
                <select
                  value={formData.tipoImmobile}
                  onChange={(e) => handleChange('tipoImmobile', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 transition-all focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Seleziona...</option>
                  <option value="Appartamento">Appartamento</option>
                  <option value="Box">Box</option>
                  <option value="Cantina">Cantina</option>
                  <option value="Garage">Garage</option>
                  <option value="Posto Auto">Posto Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interno
                </label>
                <input
                  type="text"
                  value={formData.interno}
                  onChange={(e) => handleChange('interno', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 transition-all focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Es: 5, A, 12/B"
                />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Dati Catastali (OBBLIGATORI)
              </h3>
              <div className="grid md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sezione
                  </label>
                  <input
                    type="text"
                    value={formData.sezione}
                    onChange={(e) => handleChange('sezione', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 transition-all focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foglio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.foglio}
                    onChange={(e) => handleChange('foglio', e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500 text-sm",
                      touched.foglio && errors.foglio ? 'border-red-500' : 'border-gray-200'
                    )}
                  />
                  {touched.foglio && errors.foglio && (
                    <p className="text-red-500 text-xs mt-1">{errors.foglio}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Particella <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.particella}
                    onChange={(e) => handleChange('particella', e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500 text-sm",
                      touched.particella && errors.particella ? 'border-red-500' : 'border-gray-200'
                    )}
                  />
                  {touched.particella && errors.particella && (
                    <p className="text-red-500 text-xs mt-1">{errors.particella}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subalterno <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subalterno}
                    onChange={(e) => handleChange('subalterno', e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500 text-sm",
                      touched.subalterno && errors.subalterno ? 'border-red-500' : 'border-gray-200'
                    )}
                  />
                  {touched.subalterno && errors.subalterno && (
                    <p className="text-red-500 text-xs mt-1">{errors.subalterno}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => handleChange('categoria', e.target.value.toUpperCase())}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500 text-sm",
                      touched.categoria && errors.categoria ? 'border-red-500' : 'border-gray-200'
                    )}
                    placeholder="A/2"
                  />
                  {touched.categoria && errors.categoria && (
                    <p className="text-red-500 text-xs mt-1">{errors.categoria}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sezione Proprietario */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-500 flex items-center gap-2">
              <User className="w-6 h-6" />
              Dati Proprietario
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cognome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cognome}
                  onChange={(e) => handleChange('cognome', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500",
                    touched.cognome && errors.cognome ? 'border-red-500' : 'border-gray-200'
                  )}
                />
                {touched.cognome && errors.cognome && (
                  <p className="text-red-500 text-sm mt-1">{errors.cognome}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500",
                    touched.nome && errors.nome ? 'border-red-500' : 'border-gray-200'
                  )}
                />
                {touched.nome && errors.nome && (
                  <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data di Nascita
                </label>
                <input
                  type="date"
                  value={formData.dataNascita}
                  onChange={(e) => handleChange('dataNascita', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 transition-all focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Luogo di Nascita
                </label>
                <input
                  type="text"
                  value={formData.luogoNascita}
                  onChange={(e) => handleChange('luogoNascita', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 transition-all focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Comune (Provincia)"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Fiscale <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codiceFiscale}
                  onChange={(e) => handleChange('codiceFiscale', e.target.value.toUpperCase())}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500 uppercase",
                    touched.codiceFiscale && errors.codiceFiscale ? 'border-red-500' : 'border-gray-200'
                  )}
                  maxLength="16"
                  placeholder="RSSMRA80A01H501U"
                />
                {touched.codiceFiscale && errors.codiceFiscale && (
                  <p className="text-red-500 text-sm mt-1">{errors.codiceFiscale}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quota di Possesso (%)
                </label>
                <input
                  type="number"
                  value={formData.quotaPossesso}
                  onChange={(e) => handleChange('quotaPossesso', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500",
                    touched.quotaPossesso && errors.quotaPossesso ? 'border-red-500' : 'border-gray-200'
                  )}
                  min="0"
                  max="100"
                  placeholder="Es: 100, 50, 33.33"
                />
                {touched.quotaPossesso && errors.quotaPossesso && (
                  <p className="text-red-500 text-sm mt-1">{errors.quotaPossesso}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sezione Dichiarazioni */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-500 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              Dichiarazioni
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.abitazionePrincipale}
                    onChange={(e) => handleChange('abitazionePrincipale', e.target.checked)}
                    className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      Destinazione d'uso dell'immobile
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      L'unità immobiliare sopra indicata costituisce la propria abitazione principale (residenza anagrafica e dimora abituale).
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.detrazione50}
                    onChange={(e) => handleChange('detrazione50', e.target.checked)}
                    className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      Diritto alla detrazione
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      Intendo usufruire della detrazione fiscale del 50%.
                    </p>
                  </div>
                </label>
              </div>

              <AnimatePresence>
                {formData.detrazione50 && !formData.abitazionePrincipale && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">
                          Attenzione
                        </h4>
                        <p className="text-sm text-amber-800">
                          Per richiedere la detrazione al 50% è necessario che l'immobile sia adibito ad abitazione principale. Seleziona anche la prima opzione.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {formData.abitazionePrincipale && formData.detrazione50 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-900 mb-1">
                          ✓ Requisiti soddisfatti per aliquota 50%
                        </h4>
                        <p className="text-sm text-green-800">
                          Hai i requisiti per beneficiare dell'aliquota maggiorata del 50%. L'amministrazione inserirà questa informazione nella comunicazione all'Agenzia delle Entrate.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sezione Recapiti */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-500 flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Recapiti (OBBLIGATORI)
            </h2>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Riceverai una copia dell'autocertificazione all'indirizzo email indicato.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500",
                    touched.email && errors.email ? 'border-red-500' : 'border-gray-200'
                  )}
                  placeholder="esempio@email.com"
                />
                {touched.email && errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border-2 transition-all focus:ring-2 focus:ring-purple-500",
                    touched.telefono && errors.telefono ? 'border-red-500' : 'border-gray-200'
                  )}
                  placeholder="+39 333 1234567"
                />
                {touched.telefono && errors.telefono && (
                  <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
                )}
              </div>
            </div>
          </div>

          {/* Nota finale */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-5 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Possibilità di Rettifica
            </h4>
            <p className="text-sm text-blue-800">
              Si precisa che il contribuente potrà comunque modificare e integrare la propria dichiarazione dei redditi precompilata. Si consiglia sempre di verificare con il proprio commercialista la corretta compilazione della dichiarazione precompilata ed eventualmente correggerla.
            </p>
          </div>

          {/* Privacy e invio */}
          <div className="border-t-2 border-gray-200 pt-6">
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-900 font-medium">
                Inviando questo modulo, dichiari che le informazioni fornite sono veritiere e costituiscono un'autocertificazione ai sensi del DPR 445/2000. Riceverai una copia all'indirizzo email indicato.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Calendar className="w-5 h-5" />
                  </motion.div>
                  Invio in corso...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Invia Modulo
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Data invio: {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
        </motion.form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Per informazioni contatta l'amministrazione condominiale</p>
        </div>
      </div>
    </div>
  );
}
