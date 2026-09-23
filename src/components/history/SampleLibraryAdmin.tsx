import React from 'react';
import { CheckCircle2, Database, EyeOff, ShieldCheck, Star, Tags, UserX } from 'lucide-react';
import { HistoricalSample, SampleCaseTag, SampleLibraryStatus } from '../../types';
import { OutcomeBadge, SectionCard, Tag, UI } from './historyUi';

export interface SampleOverride {
  libraryStatus?: SampleLibraryStatus;
  typicalCase?: boolean;
  allowClinicalReference?: boolean;
  caseTags?: SampleCaseTag[];
}

const ALL_TAGS: SampleCaseTag[] = [
  'MDT疑难病例',
  '胶囊FMT典型',
  '重症IBD',
  '难治复发病例',
  '老年低营养',
  '免疫抑制宿主',
  '超高龄SAE警示',
  '生物制剂初治'
];

interface SampleLibraryAdminProps {
  samples: HistoricalSample[];
  overrides: Record<string, SampleOverride>;
  onChange: (id: string, patch: SampleOverride) => void;
}

/**
 * 知识规则中心 · 历史样本库管理子页面。
 * 管理员可执行：入库 / 屏蔽 / 标记典型案例 / 打案例标签；
 * 数据不全（完整度 < 100）的病例按规则禁止入库。
 */
export const SampleLibraryAdmin: React.FC<SampleLibraryAdminProps> = ({ samples, overrides, onChange }) => {
  const effective = (s: HistoricalSample) => ({
    status: overrides[s.id]?.libraryStatus ?? s.libraryStatus,
    typical: overrides[s.id]?.typicalCase ?? s.typicalCase,
    allowRef: overrides[s.id]?.allowClinicalReference ?? s.allowClinicalReference,
    tags: overrides[s.id]?.caseTags ?? s.caseTags
  });

  const inLibrary = samples.filter(s => effective(s).status === 'in_library').length;
  const typicalCount = samples.filter(s => effective(s).typical).length;
  const blockedCount = samples.filter(s => effective(s).status === 'blocked').length;

  return (
    <div className="space-y-3.5">
      <SectionCard
        title="历史样本库管理（知识规则中心）"
        icon={<Database className="w-3.5 h-3.5 text-[#20cfff]" />}
        right={<span className="text-[10px] text-[#8996b8]">管理员权限 · 全库只读，仅可调整入库与标签属性</span>}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: '全库样本总数', value: samples.length, tone: UI.cyan },
            { label: '已入库可参考', value: inLibrary, tone: UI.green },
            { label: '典型案例标记', value: typicalCount, tone: UI.purple },
            { label: '已屏蔽', value: blockedCount, tone: UI.red }
          ].map(item => (
            <div key={item.label} className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50 text-center">
              <span className="text-[10px] text-[#8996b8] block">{item.label}</span>
              <span className="font-mono font-bold text-lg block mt-0.5" style={{ color: item.tone }}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50 text-[10px] text-[#8996b8] leading-relaxed space-y-1">
          <p className="flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#23e6b1] shrink-0 mt-0.5" />
            <span><strong className="text-[#eef4ff]">入库规则：</strong>只有完整走完 FMT 诊疗闭环（评估 → 菌群画像 → 供受体匹配 → 方案 → 执行 → 随访结局 → 不良事件）且数据完整度 = 100% 的病例方可入库；中途脱落、数据不全的病例禁止入库。</span>
          </p>
          <p className="flex items-start gap-1.5">
            <UserX className="w-3.5 h-3.5 text-[#ffb84d] shrink-0 mt-0.5" />
            <span><strong className="text-[#eef4ff]">脱敏要求：</strong>历史患者真实姓名全部脱敏，仅保留病历编号（形如 MRN-H2025-001）；本页不展示任何可识别个人身份的信息。</span>
          </p>
        </div>
      </SectionCard>

      <SectionCard title="样本清单与标签维护" icon={<Tags className="w-3.5 h-3.5 text-[#20cfff]" />}>
        <div className="space-y-2">
          {samples.map(s => {
            const e = effective(s);
            const blocked = e.status === 'blocked';
            return (
              <div
                key={s.id}
                className="p-3 rounded-lg bg-[#0c1429] border"
                style={{ borderColor: blocked ? 'rgba(255,83,108,0.45)' : 'rgba(43,65,112,0.55)' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[11px] text-[#eef4ff]">{s.id}</span>
                      <span className="text-[10px] text-[#8996b8] font-mono">{s.anonymizedMrn}</span>
                      <OutcomeBadge outcome={s.outcome} />
                      <Tag text={`数据完整度 ${s.dataCompleteness}%`} color={s.dataCompleteness === 100 ? UI.green : UI.red} />
                      {e.typical && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]" style={{ color: UI.cyan, background: 'rgba(32,207,255,0.12)' }}>
                          <Star className="w-2.5 h-2.5" fill={UI.cyan} /> 典型案例
                        </span>
                      )}
                      {!e.allowRef && <Tag text="仅作风险借鉴" color={UI.red} />}
                    </div>
                    <p className="text-[10px] text-[#8996b8] mt-1 truncate">
                      {s.diagnosisLabel} · {s.gender} {s.age}岁 · 随访 {s.followUpWeeks} 周
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => onChange(s.id, { libraryStatus: blocked ? 'in_library' : 'blocked' })}
                      disabled={s.dataCompleteness < 100 && blocked}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all flex items-center gap-1 ${
                        blocked
                          ? 'bg-[#23e6b1]/15 text-[#23e6b1] border-[#23e6b1]/45 hover:bg-[#23e6b1]/25'
                          : 'bg-[#0f1830] text-[#8996b8] border-[#2b4170]/60 hover:text-[#ff536c] hover:border-[#ff536c]/45'
                      } ${s.dataCompleteness < 100 && blocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                      title={s.dataCompleteness < 100 ? '数据不全的病例禁止入库' : ''}
                    >
                      {blocked ? <CheckCircle2 className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {blocked ? '恢复入库' : '屏蔽'}
                    </button>

                    <button
                      onClick={() => onChange(s.id, { typicalCase: !e.typical })}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all flex items-center gap-1 ${
                        e.typical
                          ? 'bg-[#20cfff]/15 text-[#20cfff] border-[#20cfff]/45'
                          : 'bg-[#0f1830] text-[#8996b8] border-[#2b4170]/60 hover:text-[#20cfff]'
                      }`}
                    >
                      <Star className="w-3 h-3" fill={e.typical ? UI.cyan : 'none'} />
                      典型案例
                    </button>

                    <button
                      onClick={() => onChange(s.id, { allowClinicalReference: !e.allowRef })}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all flex items-center gap-1 ${
                        e.allowRef
                          ? 'bg-[#23e6b1]/15 text-[#23e6b1] border-[#23e6b1]/45'
                          : 'bg-[#ff536c]/15 text-[#ff536c] border-[#ff536c]/45'
                      }`}
                    >
                      {e.allowRef ? '允许临床参考' : '仅作风险借鉴'}
                    </button>
                  </div>
                </div>

                {/* 标签维护 */}
                <div className="mt-2 pt-2 border-t border-[#1e2f57]/70 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] text-[#8996b8]">案例标签：</span>
                  {ALL_TAGS.map(tag => {
                    const on = e.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() =>
                          onChange(s.id, {
                            caseTags: on ? e.tags.filter(t => t !== tag) : [...e.tags, tag]
                          })
                        }
                        className={`px-1.5 py-0.5 rounded text-[9px] border transition-all ${
                          on ? 'text-[#815cff] border-[#815cff]/60 bg-[#815cff]/12' : 'text-[#8996b8] border-[#2b4170]/50 hover:text-[#eef4ff]'
                        }`}
                      >
                        {on ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};
