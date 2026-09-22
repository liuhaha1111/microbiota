import React, { useState } from 'react';
import { 
  Network, 
  Sparkles, 
  Dna, 
  Info, 
  BookOpen, 
  Activity
} from 'lucide-react';
import { ClinicalPatient } from '../types';
import { MicrobiomeKnowledgeGraph } from './MicrobiomeKnowledgeGraph';
import { ThreeGutDigitalTwin } from './ThreeGutDigitalTwin';

interface KnowledgeGraphExplorerProps {
  patient?: ClinicalPatient;
}

export const KnowledgeGraphExplorer: React.FC<KnowledgeGraphExplorerProps> = ({ patient }) => {
  const [activeSubMode, setActiveSubMode] = useState<'graph' | 'twin'>('graph');

  return (
    <div id="knowledge-graph-explorer-container" className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#eef4ff] flex items-center gap-2">
            <Network className="w-5 h-5 text-[#20cfff]" />
            微生态知识图谱与数字孪生全景交互中心
          </h2>
          <p className="text-xs text-[#8996b8] mt-0.5">
            {patient ? (
              <>当前受体: <span className="text-[#eef4ff] font-semibold">{patient.name}</span> ({patient.id}) · {patient.primaryDiagnosis.split(' ')[0]} · 融合菌群组学、代谢通路、宿主免疫与FMT干预靶点</>
            ) : (
              <>Microbiome Knowledge Graph & 3D Biological Twin Hub · 融合菌群组学、代谢通路、宿主免疫与FMT干预靶点</>
            )}
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center p-1 rounded-lg bg-[#091127] border border-[#2b4170]/60 text-xs">
          <button
            onClick={() => setActiveSubMode('graph')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeSubMode === 'graph' ? 'bg-[#20cfff] text-[#090d18] font-bold shadow' : 'text-[#8996b8] hover:text-[#eef4ff]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            全景知识图谱拓扑
          </button>
          <button
            onClick={() => setActiveSubMode('twin')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeSubMode === 'twin' ? 'bg-[#815cff] text-white font-bold shadow' : 'text-[#8996b8] hover:text-[#eef4ff]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            3D微生态孪生舱
          </button>
        </div>
      </div>

      {/* Main Visual Display */}
      {activeSubMode === 'graph' ? (
        <div className="space-y-4">
          <MicrobiomeKnowledgeGraph 
            mode="multidomain" 
            patient={patient}
            className="h-[720px] min-h-[640px]"
          />

          {/* Clinical Scientific Reference Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
              <h4 className="font-semibold text-[#20cfff] mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                短链脂肪酸 (SCFA) 轴机制
              </h4>
              <p className="text-[#8996b8] leading-relaxed text-[11px]">
                普氏栖粪杆菌与罗斯氏菌通过乙酸-辅酶A途径合成丁酸，提供结肠上皮70%能量，同时作为HDAC抑制剂诱导Foxp3+ Treg分化，阻断促炎细胞因子释放。
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
              <h4 className="font-semibold text-[#23e6b1] mb-1.5 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                黏膜物理屏障与AKK菌
              </h4>
              <p className="text-[#8996b8] leading-relaxed text-[11px]">
                Akkermansia muciniphila 特异降解更新外层黏液素，刺激杯状细胞回馈性分泌新鲜黏蛋白，同时其外膜蛋白 Amuc_1100 结合 TLR2 强化紧密连接 Claudin-1。
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
              <h4 className="font-semibold text-[#ff536c] mb-1.5 flex items-center gap-1.5">
                <Dna className="w-4 h-4" />
                定植抗力与次级胆汁酸
              </h4>
              <p className="text-[#8996b8] leading-relaxed text-[11px]">
                健康供体菌群富含胆盐水解酶(BSH)，将初级胆酸转化为脱氧胆酸与石胆酸，高亲和力竞争结合艰难梭菌受体，直接阻断芽孢萌发与毒素A/B基因簇表达。
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ThreeGutDigitalTwin 
            patient={patient}
            className="min-h-[580px]" 
          />
          
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 text-xs">
            <h4 className="font-semibold text-[#eef4ff] mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#20cfff]" />
              Gut Microbiome Digital Twin 大肠解剖多段高精度孪生架构
            </h4>
            <p className="text-[#8996b8] leading-relaxed">
              三维大肠解剖模型严格还原 8 大解剖分区（盲肠、阑尾、升结肠、横结肠、降结肠、乙状结肠、直肠与肛管），各段具备真实的结肠袋（Haustra）肌层纹理与特征色彩。默认以半透明「解剖透视」呈现整体轮廓，点击底部解剖标签或直接在模型上点击，对应部位即被实体着色，其余部位保持透明，便于聚焦观察；右上角可随时切换回彩色实体全貌。着色为静态实体填充，不含脉冲光晕，避免高亮层遮挡解剖结构。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
