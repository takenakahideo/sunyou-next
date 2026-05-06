'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { EstimateChatModal } from '@/components/EstimateChatModal'
import {
  Calculator,
  PhoneCall,
  ShieldCheck,
  CalendarCheck,
  Award,
  CheckCircle,
  ArrowRight,
  Smartphone,
  FileText,
  Wrench,
  BadgeCheck,
  ChevronDown,
  Star,
  MapPin,
  Clock,
  Sparkles,
  Zap,
  Home,
  Building2,
  Layers,
  TriangleAlert,
} from 'lucide-react'

// ─── データ定義 ───────────────────────────────────────────

const PEST_TYPES = [
  { id: 'hakubishin', label: 'ハクビシン・アライグマ', baseMin: 150000, baseMax: 350000, emoji: '🦝', note: '天井裏・屋根裏に多い' },
  { id: 'nezumi',     label: 'ネズミ',                 baseMin:  80000, baseMax: 200000, emoji: '🐭', note: '壁・床下・厨房周辺' },
  { id: 'shiroari',   label: 'シロアリ',               baseMin: 100000, baseMax: 500000, emoji: '🐜', note: '木造建築の土台・柱' },
  { id: 'hachi',      label: 'スズメバチ・アシナガバチ', baseMin:  20000, baseMax:  65000, emoji: '🐝', note: '軒下・天井裏・庭木' },
  { id: 'gokiburi',   label: 'ゴキブリ',               baseMin:  30000, baseMax:  85000, emoji: '🪳', note: '厨房・水回り・排水管' },
  { id: 'mukade',     label: 'ムカデ・ヤスデ',          baseMin:  25000, baseMax:  70000, emoji: '🐛', note: '湿気の多い床下・庭' },
]

const SIZE_OPTIONS = [
  { id: 's',  label: '〜50㎡',    sub: '1LDK程度',   multiplier: 1.0 },
  { id: 'm',  label: '51〜100㎡', sub: '2〜3LDK',    multiplier: 1.4 },
  { id: 'l',  label: '101〜150㎡',sub: '4LDK〜戸建', multiplier: 1.8 },
  { id: 'xl', label: '151㎡〜',   sub: '大型物件',   multiplier: 2.4 },
]

const FEATURES = [
  {
    icon: ShieldCheck,
    title: '100%の料金透明性',
    desc: 'AIが被害状況から即座に見積もりを算出。後から追加料金は一切発生しません。見積もりの承認なしに作業は開始しません。',
    accent: 'teal',
  },
  {
    icon: CalendarCheck,
    title: '非接触・完全自動予約',
    desc: '煩わしい営業電話はゼロ。カレンダーから空き枠を選ぶだけで予約が完了します。夜中でも休日でも、いつでも手続き可能。',
    accent: 'blue',
  },
  {
    icon: Award,
    title: '創業30年の現場力',
    desc: '再発率実質ゼロを誇る熟練のプロフェッショナルが施工。駆除だけでなく、侵入経路の完全封鎖まで一貫して対応します。',
    accent: 'teal',
  },
]

const FLOW_STEPS = [
  {
    step: '01',
    icon: Calculator,
    title: 'AIで即時見積もり＆予約',
    desc: 'スマホから被害の種類と物件情報を入力するだけ。AIが料金を算出し、そのままカレンダー予約へ。',
  },
  {
    step: '02',
    icon: Wrench,
    title: '専門スタッフの訪問・施工',
    desc: '熟練スタッフが訪問。徹底的な現場調査のあと、侵入経路の封鎖から駆除まで一気に完了します。',
  },
  {
    step: '03',
    icon: FileText,
    title: 'デジタル完了報告書の発行',
    desc: '施工完了後、写真付きのデジタル報告書をメール送信。施工内容・保証範囲が明記された信頼の証。',
  },
]

const REVIEWS = [
  { name: '大崎市 K様', rating: 5, text: '電話なしでネットから全部完結できたのが最高でした。見積もりも正確で追加料金ゼロ。' },
  { name: '仙台市 M様', rating: 5, text: 'ハクビシンに3か月悩んでいたのが、施工後ぴったり再発なし。報告書も丁寧でした。' },
  { name: '栗原市 S様', rating: 5, text: '夜中にサイトを見て、そのまま予約できた。翌日連絡が来て驚きました。' },
]

// ─── ユーティリティ ───────────────────────────────────────

function formatYen(n: number) {
  return `¥${n.toLocaleString('ja-JP')}`
}

function openYui() {
  window.dispatchEvent(new CustomEvent('openEstimate', {}))
}

// ─── サブコンポーネント ───────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
        />
      ))}
    </div>
  )
}

// ─── セクション：ヒーロー ──────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-white">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-teal-50/40 to-blue-950/5 pointer-events-none" />

      {/* 装飾サークル */}
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-teal-400/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-blue-950/6 blur-3xl pointer-events-none" />

      {/* グリッドパターン */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 py-28 w-full">
        <div className="max-w-3xl">
          {/* バッジ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-600 text-sm font-medium mb-8"
          >
            <Sparkles size={14} />
            <span>創業30年 × AIスマート対応</span>
          </motion.div>

          {/* メインコピー */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-950 leading-[1.2] tracking-tight mb-6"
          >
            もう、見えない不安に
            <br />
            <span className="text-teal-500">悩まない。</span>
            <br className="hidden md:block" />
            スマートに、確実に終わらせる。
          </motion.h1>

          {/* サブコピー */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-500 leading-relaxed mb-10 max-w-xl"
          >
            創業30年の確かな駆除技術 × AIによる透明な料金提示。
            <br />
            お見積りからご予約まで、スマホひとつで完結します。
          </motion.p>

          {/* CTAボタン群 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button onClick={openYui} className="group flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-base shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-teal-400/40 hover:scale-[1.02] active:scale-[0.98]">
              <Sparkles size={20} />
              佐藤結衣に相談する
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* 信頼バッジ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center gap-6 mt-12 text-sm text-slate-400"
          >
            {[
              { icon: BadgeCheck, text: '追加料金なし保証' },
              { icon: Clock,      text: '24時間365日受付' },
              { icon: MapPin,     text: '宮城県全域対応' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon size={15} className="text-teal-500" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* スクロールインジケーター */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-300"
      >
        <ChevronDown size={28} />
      </motion.div>
    </section>
  )
}

// ─── セクション：3つの特徴 ────────────────────────────────

function FeaturesSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-teal-500 font-semibold text-sm tracking-widest uppercase mb-3">Our Promise</p>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-950">3つの「スマート」なお約束</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 cursor-default"
              >
                <div className={`inline-flex p-3 rounded-xl mb-6 ${
                  f.accent === 'teal' ? 'bg-teal-50' : 'bg-blue-50'
                }`}>
                  <Icon size={24} className={f.accent === 'teal' ? 'text-teal-500' : 'text-blue-950'} />
                </div>
                <h3 className="text-lg font-bold text-blue-950 mb-3">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── セクション：AI見積もりシミュレーター ─────────────────

function SimulatorSection() {
  const [selectedPest, setSelectedPest] = useState(PEST_TYPES[0])
  const [selectedSize, setSelectedSize] = useState(SIZE_OPTIONS[0])

  const minPrice = Math.round((selectedPest.baseMin * selectedSize.multiplier) / 1000) * 1000
  const maxPrice = Math.round((selectedPest.baseMax * selectedSize.multiplier) / 1000) * 1000

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-teal-500 font-semibold text-sm tracking-widest uppercase mb-3">AI Estimate</p>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-950 mb-4">
            料金が、10秒でわかる。
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            被害の種類と物件の広さを選ぶだけ。AIが即座に概算料金を算出します。
          </p>
        </motion.div>

        {/* スマホフレーム */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          {/* フレーム外装 */}
          <div className="relative bg-blue-950 rounded-[2.5rem] p-3 shadow-2xl shadow-blue-950/30">
            {/* ノッチ */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-blue-950 rounded-full z-10" />

            {/* 画面内容 */}
            <div className="bg-slate-50 rounded-[2rem] overflow-hidden">
              {/* アプリヘッダー */}
              <div className="bg-teal-500 px-5 pt-10 pb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={16} className="text-white/80" />
                  <p className="text-white/80 text-xs font-medium">AI ESTIMATE</p>
                </div>
                <p className="text-white font-bold text-lg leading-tight">
                  スマート見積もり
                </p>
              </div>

              <div className="p-5 space-y-5">
                {/* 被害の種類 */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    被害の種類
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PEST_TYPES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPest(p)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all duration-150 border ${
                          selectedPest.id === p.id
                            ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                        }`}
                      >
                        <span className="text-base leading-none">{p.emoji}</span>
                        <span className="leading-tight">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedPest && (
                    <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <TriangleAlert size={10} />
                      {selectedPest.note}
                    </p>
                  )}
                </div>

                {/* 建物の広さ */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    建物の広さ
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSize(s)}
                        className={`flex flex-col items-center py-2.5 rounded-xl text-xs font-medium transition-all duration-150 border ${
                          selectedSize.id === s.id
                            ? 'bg-blue-950 border-blue-950 text-white shadow-md shadow-blue-950/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        <span className="font-bold text-[11px]">{s.label}</span>
                        <span className="text-[9px] opacity-70 mt-0.5">{s.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 料金表示 */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedPest.id}-${selectedSize.id}`}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-2xl p-5 text-white"
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      <Sparkles size={13} className="text-teal-400" />
                      <p className="text-teal-400 text-xs font-semibold">AI概算見積もり</p>
                    </div>
                    <p className="text-xs text-white/50 mb-1">施工費用の目安</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {formatYen(minPrice)}
                      <span className="text-lg text-white/60 mx-1">〜</span>
                      {formatYen(maxPrice)}
                    </p>
                    <p className="text-[10px] text-white/40 mt-2">
                      ※現地調査後に正式見積もりを発行します。正式見積もりの承認なしに作業は開始しません。
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* 予約ボタン */}
                <button onClick={openYui} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm shadow-lg shadow-teal-500/25 transition-all duration-150 active:scale-[0.97]">
                  <Sparkles size={16} />
                  佐藤結衣に相談する
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* フレーム下のホームバー風 */}
          <div className="flex justify-center mt-3">
            <div className="w-28 h-1 bg-blue-950/20 rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── セクション：解決ステップ ─────────────────────────────

function FlowSection() {
  return (
    <section className="py-24 bg-blue-950">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-teal-400 font-semibold text-sm tracking-widest uppercase mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            解決まで、たった3ステップ。
          </h2>
        </motion.div>

        <div className="relative">
          {/* コネクタライン（デスクトップ） */}
          <div className="hidden md:block absolute top-10 left-[calc(16.666%+2rem)] right-[calc(16.666%+2rem)] h-px bg-gradient-to-r from-teal-500/30 via-teal-400/60 to-teal-500/30" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {FLOW_STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center"
                >
                  {/* ステップ番号 */}
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                      <Icon size={28} className="text-teal-400" />
                    </div>
                    <span className="absolute -top-1 -right-1 text-xs font-bold text-blue-950 bg-teal-400 rounded-full w-6 h-6 flex items-center justify-center">
                      {s.step}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-base mb-3">{s.title}</h3>
                  <p className="text-blue-200/60 text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── セクション：お客様の声 ───────────────────────────────

function ReviewsSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-teal-500 font-semibold text-sm tracking-widest uppercase mb-3">Reviews</p>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-950">お客様の声</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <StarRating rating={r.rating} />
              <p className="text-slate-600 text-sm leading-relaxed mt-4 mb-5">
                「{r.text}」
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-teal-600 font-bold text-xs">{r.name[0]}</span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{r.name}</p>
                <div className="ml-auto flex items-center gap-1">
                  <CheckCircle size={13} className="text-teal-500" />
                  <span className="text-[10px] text-teal-500 font-medium">施工済み</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── セクション：最終CTA ─────────────────────────────────

function FinalCTASection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex p-4 rounded-2xl bg-teal-50 mb-8">
            <Smartphone size={32} className="text-teal-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-950 mb-5">
            今すぐ、不安を終わらせましょう。
          </h2>
          <p className="text-slate-500 leading-relaxed mb-10">
            電話不要・来店不要。スマホからAIに相談するだけで、<br className="hidden md:block" />
            見積もり・予約・完了報告まで、すべてデジタルで完結します。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={openYui} className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-base shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-teal-400/40 hover:scale-[1.02] active:scale-[0.98]">
              <Sparkles size={20} />
              佐藤結衣に相談する
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-6">
            三友薬品消毒 ｜ 創業30年 ｜ 宮城県全域対応 ｜ 追加料金なし保証
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ─── フッター ────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-blue-950 py-12 pb-28 md:pb-12">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="text-white font-bold text-lg mb-1">三友薬品消毒</p>
            <p className="text-blue-300/60 text-sm">Sanyu Pharmaceutical Disinfection</p>
            <p className="text-blue-300/50 text-xs mt-2">宮城県大崎市 ｜ 創業30年</p>
            <p className="text-blue-300/40 text-xs mt-1 flex items-center gap-1">
              <PhoneCall size={10} />
              お急ぎの場合：<a href="tel:0120893025" className="underline hover:text-blue-300/70 transition-colors">0120-893-025</a>
            </p>
          </div>
          <div className="text-blue-300/40 text-xs leading-relaxed text-left md:text-right">
            <p>© 2025 三友薬品消毒 / サンユー・ネクスト合同会社</p>
            <p className="mt-1">All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── スティッキーフッターCTA ──────────────────────────────

function StickyFooterCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200 px-4 py-3 shadow-2xl shadow-black/10">
            <div className="flex max-w-md mx-auto">
              <button onClick={openYui} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm shadow-md shadow-teal-500/20 transition-all active:scale-95">
                <Sparkles size={17} />
                佐藤結衣に相談する
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── ナビゲーション ───────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-bold text-blue-950 text-base">三友薬品消毒</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-500">
          <a href="#features" className="hover:text-blue-950 transition-colors">特徴</a>
          <a href="#estimate" className="hover:text-blue-950 transition-colors">料金シミュレーター</a>
          <a href="#flow" className="hover:text-blue-950 transition-colors">ご利用の流れ</a>
        </nav>

        <button onClick={openYui} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm shadow-sm shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Sparkles size={15} />
          <span className="hidden sm:inline">佐藤結衣に相談する</span>
          <span className="sm:hidden">相談する</span>
        </button>
      </div>
    </header>
  )
}

// ─── メインエクスポート ────────────────────────────────────

export default function SanyuNextLandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="estimate">
          <SimulatorSection />
        </div>
        <div id="flow">
          <FlowSection />
        </div>
        <ReviewsSection />
        <FinalCTASection />
      </main>
      <Footer />
      <StickyFooterCTA />
      <EstimateChatModal />
    </div>
  )
}
