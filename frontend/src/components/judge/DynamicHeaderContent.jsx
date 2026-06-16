import {
  HeaderCompact,HeaderElevated,HeaderStructured,

} from '../../components/judge/index'

export default function DynamicHeaderContent({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
  const template = sysConfig.header_template || 'structured';
  const sharedProps = { sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked };

  if (template === 'compact')  return <HeaderCompact  {...sharedProps} />;
  if (template === 'elevated') return <HeaderElevated {...sharedProps} />;
  return <HeaderStructured {...sharedProps} />;
}


