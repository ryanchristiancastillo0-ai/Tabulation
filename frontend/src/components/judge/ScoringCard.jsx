 import { memo } from 'react';

 
 import {ScrollHint} from '../../components/judge/index'
 import { USALoader } from '../../components/index'

 const ScoringCard = memo(function ScoringCard({ tableHtml, loading, refreshing }) {
   const hasTable = !!tableHtml;

   return (
     <>
       {!loading && tableHtml && <ScrollHint />}

       {loading && !hasTable ? (
         <USALoader
           fullScreen={false}
           prompt="Building interface…"
           background="transparent"
         />
       ) : (
         <div className="ai-scroll-container" style={{ position: 'relative' }}>
           {(refreshing || loading) && (
             <div
               style={{
                 position: 'absolute',
                 inset: 0,
                 zIndex: 50,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 background: 'rgba(255,255,255,0.85)',
                 backdropFilter: 'blur(4px)',
               }}
             >
               <USALoader
                 fullScreen={false}
                 prompt={loading ? 'Please wait…' : 'Updating interface…'}
                 background="transparent"
               />
             </div>
           )}
           <div
             className="ai-rendered-content"
             dangerouslySetInnerHTML={{ __html: tableHtml }}
           />
         </div>
       )}
     </>
   );
 }, (prev, next) =>
   prev.tableHtml   === next.tableHtml &&
   prev.loading     === next.loading &&
   prev.refreshing  === next.refreshing
 );

 export default ScoringCard