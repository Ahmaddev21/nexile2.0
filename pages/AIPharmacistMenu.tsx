import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Activity, Calculator, Pill, Leaf, Star, ShieldAlert, FileText, ArrowUpRight } from 'lucide-react';

type ModuleCard = {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  seedQuery: string;
};

export default function AIPharmacistMenu() {
  const navigate = useNavigate();

  const modules: ModuleCard[] = [
    {
      icon: Activity,
      title: 'Drug Interaction Checker',
      description: 'Assess interaction severity, mechanisms, and clinical advice.',
      seedQuery: 'Can Ibuprofen be taken with Aspirin? Provide interaction level and clinical advice.'
    },
    {
      icon: Calculator,
      title: 'Dosage Calculator',
      description: 'Weight and age-based dosing with maximum safe limits.',
      seedQuery: '30kg pediatric patient: Amoxicillin dosage, max daily dose, and interval.'
    },
    {
      icon: Pill,
      title: 'Pharmaceutical Advice',
      description: 'Side effects, contraindications, administration and counseling points.',
      seedQuery: 'Metformin: side effects, contraindications, and key counseling points.'
    },
    {
      icon: Leaf,
      title: 'Non-Pharmaceutical Advice',
      description: 'Lifestyle, diet, hydration, rest, and home care guidance.',
      seedQuery: 'Hypertension lifestyle recommendations with evidence-based guidance.'
    },
    {
      icon: Star,
      title: 'OTC Recommendation Support',
      description: 'Suggest safe OTC options for common symptoms with cautions.',
      seedQuery: 'Seasonal allergies: safe OTC options and screening cautions.'
    }
  ];

  const handleLaunch = (seed?: string) => {
    if (seed) {
      sessionStorage.setItem('nexile_pharmacist_seed_query', seed);
    }
    navigate('/ai-pharmacist/chat');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-200">
            <BrainCircuit className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Nexile AI</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Advanced Real-time Clinical Intelligence for Pharmacists</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleLaunch()} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors">
            Launch Assistant <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m, i) => {
          const Icon = m.icon;
          return (
            <button key={i} onClick={() => handleLaunch(m.seedQuery)} className="text-left p-6 bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Icon size={18} className="text-slate-600 dark:text-slate-300" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-white">{m.title}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{m.description}</p>
              <div className="mt-4 text-xs text-brand-600">Try: {m.seedQuery}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-dark-border">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide mb-3 flex items-center">
            <FileText size={14} className="mr-2" /> Trusted Sources
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'WHO', url: 'https://www.who.int/' },
              { label: 'FDA', url: 'https://www.fda.gov/' },
              { label: 'NHS', url: 'https://www.nhs.uk/' },
              { label: 'MedlinePlus', url: 'https://medlineplus.gov/' },
              { label: 'DrugBank', url: 'https://go.drugbank.com/' },
              { label: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }
            ].map((s, idx) => (
              <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-brand-600">
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-dark-border">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide mb-3 flex items-center">
            <ShieldAlert size={14} className="mr-2 text-amber-500" /> Safety & Ethics
          </h3>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <li>Supports clinical decisions; not a diagnostic tool</li>
            <li>Avoids harmful or illegal guidance</li>
            <li>Encourages pharmacist judgement and caution</li>
            <li>Respects patient privacy</li>
            <li>Includes medical disclaimers in every response</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
