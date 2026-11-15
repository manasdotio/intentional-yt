'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { CURATED_PACKS } from '../data/curatedPacks'

const STUDY_CATEGORIES = [
  { id: 'all', label: 'All Channels (93)' },
  { id: 'cs', label: 'Computer Science & Code' },
  { id: 'math', label: 'Mathematics & Data' },
  { id: 'stem', label: 'Physics & Engineering' },
  { id: 'med', label: 'Medicine & Biology' },
  { id: 'uni', label: 'University Lectures' }
]

const STUDY_CHANNELS = [
  // CS & Programming
  { handle: '@cs50', category: 'cs', name: 'CS50', note: 'Harvard introduction to computer science' },
  { handle: '@freecodecamp', category: 'cs', name: 'freeCodeCamp', note: 'Full-length software engineering curricula' },
  { handle: '@Fireship', category: 'cs', name: 'Fireship', note: 'Concise developer concepts in 100 seconds' },
  { handle: '@NeetCode', category: 'cs', name: 'NeetCode', note: 'Data structures and algorithmic problem solving' },
  { handle: '@NeetCodeIO', category: 'cs', name: 'NeetCodeIO', note: 'System design and technical interview prep' },
  { handle: '@ByteByteGo', category: 'cs', name: 'ByteByteGo', note: 'Software architecture and distributed systems' },
  { handle: '@ContinuousDelivery', category: 'cs', name: 'Continuous Delivery', note: 'Software engineering practices by Dave Farley' },
  { handle: '@ThePrimeagen', category: 'cs', name: 'ThePrimeagen', note: 'Developer tooling and systems programming' },
  { handle: '@ThePrimeTimeagen', category: 'cs', name: 'ThePrimeTimeagen', note: 'Tech industry analysis and news commentary' },
  { handle: '@EngineerMan', category: 'cs', name: 'Engineer Man', note: 'Systems programming, Linux, and Python' },
  { handle: '@LowLevelJavaScript', category: 'cs', name: 'Low Level JavaScript', note: 'Compilers, interpreters, and runtime internals' },
  { handle: '@CodeAesthetic', category: 'cs', name: 'Code Aesthetic', note: 'Clean architecture and visual design principles' },
  { handle: '@geohotarchive', category: 'cs', name: 'George Hotz Archive', note: 'Deep learning runtimes and kernel engineering' },
  { handle: '@TsodingDaily', category: 'cs', name: 'Tsoding Daily', note: 'Recreation of compilers and game engines in C' },
  { handle: '@JonGjengset', category: 'cs', name: 'Jon Gjengset', note: 'In-depth Rust programming and systems code' },
  { handle: '@NoBoilerplate', category: 'cs', name: 'No Boilerplate', note: 'Fast-paced Rust and mental models' },
  { handle: '@anthonygg_', category: 'cs', name: 'Anthony GG', note: 'Golang backend architectures and microservices' },
  { handle: '@DreamsOfCode', category: 'cs', name: 'Dreams of Code', note: 'Go and modern web architectures' },
  { handle: '@TraversyMedia', category: 'cs', name: 'Traversy Media', note: 'Practical web development crash courses' },
  { handle: '@KevinPowell', category: 'cs', name: 'Kevin Powell', note: 'Modern CSS specifications and responsive design' },
  { handle: '@NetNinja', category: 'cs', name: 'Net Ninja', note: 'Step-by-step frontend and backend libraries' },
  { handle: '@Coreyms', category: 'cs', name: 'Corey Schafer', note: 'Definitive Python programming tutorials' },
  { handle: '@WebDevSimplified', category: 'cs', name: 'Web Dev Simplified', note: 'JavaScript APIs and state management patterns' },
  { handle: '@HusseinNasser-software', category: 'cs', name: 'Hussein Nasser', note: 'Networking, databases, and backend protocols' },
  { handle: '@ArjanCodes', category: 'cs', name: 'ArjanCodes', note: 'Object-oriented design patterns in Python' },
  { handle: '@TechWithTim', category: 'cs', name: 'Tech With Tim', note: 'Python, machine learning, and automation' },
  { handle: '@programmingwithmosh', category: 'cs', name: 'Programming with Mosh', note: 'Introductory programming languages' },
  { handle: '@TheCodingTrain', category: 'cs', name: 'The Coding Train', note: 'Creative coding with Daniel Shiffman' },
  { handle: '@deggendorf', category: 'cs', name: 'Computerphile', note: 'Theoretical computing and algorithmic security' },
  { handle: '@sentdex', category: 'cs', name: 'sentdex', note: 'Neural networks from scratch in Python' },
  { handle: '@DerekBanas', category: 'cs', name: 'Derek Banas', note: 'Rapid single-video language overviews' },
  { handle: '@DaveGrayTeachesCode', category: 'cs', name: 'Dave Gray', note: 'Accessible full-stack web courses' },
  { handle: '@AmigosCode', category: 'cs', name: 'Amigoscode', note: 'Java, Spring Boot, and cloud deployments' },
  { handle: '@JackHerrington', category: 'cs', name: 'Jack Herrington', note: 'Advanced React architectural patterns' },
  { handle: '@SebastianLague', category: 'cs', name: 'Sebastian Lague', note: 'Procedural generation, raytracing, and graphics' },
  { handle: '@BenEater', category: 'cs', name: 'Ben Eater', note: 'Building 8-bit computers from breadboard logic' },

  // Mathematics & Data
  { handle: '@3blue1brown', category: 'math', name: '3Blue1Brown', note: 'Geometric intuitions for linear algebra and calculus' },
  { handle: '@numberphile', category: 'math', name: 'Numberphile', note: 'Pure mathematical proofs and recreational numbers' },
  { handle: '@standupmaths', category: 'math', name: 'Stand-up Maths', note: 'Practical and humorous mathematical experiments' },
  { handle: '@statquest', category: 'math', name: 'StatQuest with Josh Starmer', note: 'Statistics and machine learning broken down simply' },
  { handle: '@ProfessorLeonard', category: 'math', name: 'Professor Leonard', note: 'Full university calculus and differential equations' },
  { handle: '@blackpenredpen', category: 'math', name: 'blackpenredpen', note: 'Integral calculus and competition math' },
  { handle: '@brianmclogan', category: 'math', name: 'Brian McLogan', note: 'High school and college algebra fundamentals' },
  { handle: '@MichaelPennMath', category: 'math', name: 'Michael Penn', note: 'Number theory and abstract algebra lectures' },
  { handle: '@PBSInfiniteSeries', category: 'math', name: 'PBS Infinite Series', note: 'Conceptual explorations of higher mathematics' },
  { handle: '@BriTheMathGuy', category: 'math', name: 'BriTheMathGuy', note: 'Real analysis and college mathematics' },
  { handle: '@FlammableMaths', category: 'math', name: 'Flammable Maths', note: 'Challenging integrals and calculus oddities' },
  { handle: '@ZachStar', category: 'math', name: 'Zach Star', note: 'Applied engineering and mathematical applications' },

  // STEM & Physics & Engineering
  { handle: '@veritasium', category: 'stem', name: 'Veritasium', note: 'Scientific principles and physical demonstrations' },
  { handle: '@minutephysics', category: 'stem', name: 'MinutePhysics', note: 'Hand-drawn physics concepts in under five minutes' },
  { handle: '@MichelvanBiezen', category: 'stem', name: 'Michel van Biezen', note: 'Step-by-step physics and chemistry problem solving' },
  { handle: '@PhysicsGirl', category: 'stem', name: 'Physics Girl', note: 'Fluid dynamics and physical curiosity demos' },
  { handle: '@SmarterEveryDay', category: 'stem', name: 'Smarter Every Day', note: 'High-speed camera engineering deep-dives' },
  { handle: '@RealEngineering', category: 'stem', name: 'Real Engineering', note: 'Aerospace, structural, and civil engineering' },
  { handle: '@PracticalEngineering', category: 'stem', name: 'Practical Engineering', note: 'Infrastructure and civil engineering simulations' },
  { handle: '@SteveMould', category: 'stem', name: 'Steve Mould', note: 'Apparatus-driven physics and acoustic phenomena' },
  { handle: '@ElectroBOOM', category: 'stem', name: 'ElectroBOOM', note: 'Circuit design and electrical engineering principles' },
  { handle: '@AppliedScience', category: 'stem', name: 'Applied Science', note: 'Electron microscopes, vacuum chambers, and materials' },
  { handle: '@MarkRober', category: 'stem', name: 'Mark Rober', note: 'Creative engineering problem solving' },
  { handle: '@TheActionLab', category: 'stem', name: 'The Action Lab', note: 'Physical material anomalies and science experiments' },
  { handle: '@Lesics', category: 'stem', name: 'Lesics', note: 'Clear 3D mechanical animations and motors' },
  { handle: '@EngineeringMindset', category: 'stem', name: 'The Engineering Mindset', note: 'HVAC, electrical components, and industrial design' },
  { handle: '@TheOrganicChemistryTutor', category: 'stem', name: 'The Organic Chemistry Tutor', note: 'Comprehensive chemistry and physics review' },
  { handle: '@Kurzgesagt', category: 'stem', name: 'Kurzgesagt', note: 'Scientific research and astrophysics in animation' },
  { handle: '@SciShow', category: 'stem', name: 'SciShow', note: 'Scientific discoveries and natural sciences' },
  { handle: '@PBSSpaceTime', category: 'stem', name: 'PBS Space Time', note: 'Astrophysics, quantum mechanics, and relativity' },
  { handle: '@DomainofScience', category: 'stem', name: 'Domain of Science', note: 'High-level maps of scientific disciplines' },
  { handle: '@UpAndAtom', category: 'stem', name: 'Up and Atom', note: 'Logic puzzles and quantum physics concepts' },
  { handle: '@BranchEducation', category: 'stem', name: 'Branch Education', note: 'Photorealistic 3D semiconductor and hardware guides' },
  { handle: '@NileRed', category: 'stem', name: 'NileRed', note: 'Experimental laboratory chemistry synthesis' },

  // Medicine & Biology
  { handle: '@NinjaNerdOfficial', category: 'med', name: 'Ninja Nerd', note: 'Medical school anatomy, physiology, and pathology' },
  { handle: '@Chubbyemu', category: 'med', name: 'Chubbyemu', note: 'Clinical toxicology and emergency medical cases' },
  { handle: '@JourneytoMicro', category: 'med', name: 'Journey to the Microcosmos', note: 'Microscopic biology and microbial ecology' },
  { handle: '@AmoebaSisters', category: 'med', name: 'Amoeba Sisters', note: 'Illustrated biological concepts and genetics' },
  { handle: '@ArmandoHasudungan', category: 'med', name: 'Armando Hasudungan', note: 'Hand-drawn medical pharmacology and immunology' },
  { handle: '@Medcram', category: 'med', name: 'MedCram', note: 'Medical lectures by Dr. Roger Seheult' },
  { handle: '@Osmosis', category: 'med', name: 'Osmosis from Elsevier', note: 'Health science and pathophysiology visual guides' },
  { handle: '@NatureVideoChannel', category: 'med', name: 'Nature Video', note: 'Peer-reviewed research digests from Nature Journal' },

  // University Lectures & Humanities
  { handle: '@mitocw', category: 'uni', name: 'MIT OpenCourseWare', note: 'Full unedited MIT undergraduate lecture series' },
  { handle: '@StanfordOnline', category: 'uni', name: 'Stanford Online', note: 'Artificial intelligence and engineering lectures' },
  { handle: '@Harvard', category: 'uni', name: 'Harvard University', note: 'Public lectures and distinguished faculty addresses' },
  { handle: '@khanacademy', category: 'uni', name: 'Khan Academy', note: 'Foundational education across all grade levels' },
  { handle: '@crashcourse', category: 'uni', name: 'CrashCourse', note: 'Curated high-school and introductory college series' },
  { handle: '@TEDEd', category: 'uni', name: 'TED-Ed', note: 'Short educational lessons crafted by teachers' },
  { handle: '@TED', category: 'uni', name: 'TED', note: 'Ideas worth spreading across science and culture' },
  { handle: '@BigThink', category: 'uni', name: 'Big Think', note: 'Expert interviews with scientists and philosophers' },
  { handle: '@LexFridman', category: 'uni', name: 'Lex Fridman', note: 'Long-form academic dialogues with scientists' }
]

export default function StudyAllowlistTool() {
  const [selectedCat, setSelectedCat] = useState('all')
  const [search, setSearch] = useState('')
  const [copiedHandles, setCopiedHandles] = useState(false)
  const [copiedSingle, setCopiedSingle] = useState(null)

  const csPack = CURATED_PACKS.find(p => p.id === 'cs-coding-study-pack') || CURATED_PACKS[2]

  const filteredChannels = useMemo(() => {
    return STUDY_CHANNELS.filter(item => {
      const matchCat = selectedCat === 'all' || item.category === selectedCat
      const matchSearch = item.handle.toLowerCase().includes(search.toLowerCase()) ||
                          item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.note.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [selectedCat, search])

  const handleCopyAll = async () => {
    try {
      const text = STUDY_CHANNELS.map(c => c.handle).join('\n')
      await navigator.clipboard.writeText(text)
      setCopiedHandles(true)
      setTimeout(() => setCopiedHandles(false), 2500)
    } catch (_) {}
  }

  const handleCopySingle = async (handle) => {
    try {
      await navigator.clipboard.writeText(handle)
      setCopiedSingle(handle)
      setTimeout(() => setCopiedSingle(null), 1800)
    } catch (_) {}
  }

  const handleDownloadJson = () => {
    const payload = {
      name: 'Study Only YouTube Allowlist',
      version: 1,
      generated: new Date().toISOString(),
      channels: STUDY_CHANNELS.map(c => c.handle)
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'intentional-yt-study-allowlist.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ margin: '30px 0' }}>
      {/* Action Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          marginBottom: '30px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#3b82f6'
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase' }}>
              93 Verified Educational Creators
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            In Allowlist Mode, Intentional YT hides or dims 100% of non-approved channels across YouTube.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={handleCopyAll}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            {copiedHandles ? '✓ Copied 93 Handles' : 'Copy All 93 Handles'}
          </button>
          <button
            onClick={handleDownloadJson}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            Download .JSON
          </button>
          <Link
            href={`/setup#s=${csPack.code}`}
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            1-Click Study Preset →
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {STUDY_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              style={{
                background: selectedCat === cat.id ? 'var(--text)' : 'var(--surface)',
                color: selectedCat === cat.id ? 'var(--bg)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter channels (e.g. 3Blue1Brown, Python)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '7px 14px',
            fontSize: '13px',
            color: 'var(--text)',
            minWidth: '260px'
          }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 180px 1fr 100px',
            padding: '12px 18px',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border)',
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}
        >
          <div>Channel</div>
          <div>Field</div>
          <div>Focus Area</div>
          <div style={{ textAlign: 'right' }}>Action</div>
        </div>

        <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
          {filteredChannels.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No educational channels match your filter.
            </div>
          ) : (
            filteredChannels.map(item => (
              <div
                key={item.handle}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 180px 1fr 100px',
                  padding: '12px 18px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '13px',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text)' }}>{item.name}</div>
                  <div style={{ fontFamily: 'var(--site-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.handle}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {item.note}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleCopySingle(item.handle)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: copiedSingle === item.handle ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedSingle === item.handle ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
