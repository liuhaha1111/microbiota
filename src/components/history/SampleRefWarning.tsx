import React from 'react';
import { AlertTriangle, Lock, ShieldAlert, X } from 'lucide-react';
import { UI } from './historyUi';

/** 全局常驻提示条：整个模块任何视图下都不会消失（医疗安全强制要求） */
export const GlobalRefBanner: React.FC = () => (
  <div
    id="history-library-global-warning"
    className="px-3.5 py-2 rounded-lg border flex items-start gap-2 text-[11px] leading-relaxed"
    style={{
      background: 'rgba(255,184,77,0.10)',
      borderColor: 'rgba(255,184,77,0.38)',
      color: '#ffd9a3'
    }}
  >
    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: UI.amber }} />
    <p>
      <strong className="font-bold" style={{ color: UI.amber }}>
        历史治疗样本仅作临床参考
      </strong>
      ：历史病例不能等同于当前患者，相似度不等于预后保证，禁止直接照搬方案；参照参数后必须重新完成 FMT 适应性评估、
      安全风险门控与 MDT／医师审核，最终诊疗决策由接诊医生负责。
    </p>
  </div>
);

/** 结局不佳样本的强制醒目提示条 */
export const BadOutcomeAlert: React.FC<{ text: string; tone?: string }> = ({ text, tone = UI.red }) => (
  <div
    className="px-3 py-2 rounded-lg border flex items-center gap-2 text-[11px] font-semibold"
    style={{ background: `${tone}1a`, borderColor: `${tone}80`, color: tone }}
  >
    <ShieldAlert className="w-4 h-4 shrink-0" />
    {text}
  </div>
);

interface CopyConfirmModalProps {
  open: boolean;
  sampleId: string;
  outcomeLabel: string;
  params: Array<{ label: string; value: string }>;
  blocked?: boolean;
  blockedReason?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** 标记参考前的可视化确认模态框：明示该样本用了哪些参数，并醒目标红风险 */
export const CopyConfirmModal: React.FC<CopyConfirmModalProps> = ({
  open,
  sampleId,
  outcomeLabel,
  params,
  blocked = false,
  blockedReason,
  onCancel,
  onConfirm
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04060d]/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-[#0f1830] border border-[#2b4170] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2f57] bg-[#101a33]">
          <h3 className="text-sm font-bold text-[#eef4ff] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#20cfff]" />
            标记历史样本为当前患者方案参考
            <span className="text-[10px] font-mono font-normal text-[#8996b8]">来源样本 {sampleId}</span>
          </h3>
          <button onClick={onCancel} className="p-1 rounded text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 max-h-[62vh] overflow-y-auto">
          {blocked && (
            <div
              className="p-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-2"
              style={{ background: 'rgba(255,83,108,0.14)', borderColor: 'rgba(255,83,108,0.55)', color: UI.red }}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {blockedReason ?? '该历史样本已被标记为不允许临床参考，无法标记为参考。'}
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50 text-[11px]">
            <span className="text-[#8996b8]">该历史样本当时结局：</span>
            <span className="text-[#eef4ff] font-semibold ml-1">{outcomeLabel}</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-[#8996b8] block">
              该样本的方案参数（共 {params.length} 项，仅供人工对照，不自动写入任何草稿）
            </span>
            {params.map(p => (
              <div
                key={p.label}
                className="p-2 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 flex items-start gap-2 text-[11px]"
              >
                <span className="text-[#8996b8] w-20 shrink-0">{p.label}</span>
                <span className="text-[#eef4ff] flex-1">{p.value}</span>
              </div>
            ))}
          </div>

          <div
            className="p-3 rounded-lg border text-[11px] leading-relaxed font-medium"
            style={{ background: 'rgba(255,83,108,0.12)', borderColor: 'rgba(255,83,108,0.55)', color: '#ffc2cb' }}
          >
            【本内容来自历史相似病例样本参考，不构成诊疗建议，请结合当前患者菌群、供体菌液实际情况重新评估、修改，
            完成风险门控校验后方可提交审核】
          </div>

          <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#ffb84d]/40 text-[10px] text-[#ffd9a3] leading-relaxed">
            标记仅为<strong className="font-bold">屏内参考状态</strong>，不会把参数写入其他屏的方案草稿。
            参照该样本时，原有全部安全门控（感染排查、禁忌症、菌液有效期、知情同意、医师／MDT 审核）
            <strong className="font-bold">必须针对当前患者全部重新执行</strong>，不继承历史样本的审核状态。
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[#1e2f57] bg-[#101a33]">
          <span className="text-[10px] text-[#8996b8]">已阅读并理解上述风险提示</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs border border-[#2b4170] text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347] transition-all"
            >
              取消
            </button>
            <button
              disabled={blocked}
              onClick={onConfirm}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                blocked
                  ? 'bg-[#152347] text-[#8996b8] cursor-not-allowed'
                  : 'bg-[#20cfff] text-[#090d18] hover:brightness-110 shadow-[0_0_12px_rgba(32,207,255,0.3)]'
              }`}
            >
              确认标记为参考
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** 只读水印：历史样本不可编辑 */
export const ReadOnlyHint: React.FC<{ text?: string }> = ({ text = '历史样本库数据只读，不可修改' }) => (
  <span className="inline-flex items-center gap-1 text-[10px] text-[#8996b8]">
    <Lock className="w-3 h-3" />
    {text}
  </span>
);
