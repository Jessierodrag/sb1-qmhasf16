import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AgeVerificationProps {
  onAccept: () => void;
  onDecline: () => void;
}

const AgeVerification: React.FC<AgeVerificationProps> = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100]">
      <div className="bg-dark-50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6 text-rose">
            <AlertTriangle className="h-8 w-8" />
            <h2 className="text-2xl font-bold text-gray-200">Attention</h2>
          </div>

          <div className="space-y-4 text-gray-300 text-sm sm:text-base">
            <p className="font-semibold">
              Le site internet FireRoses est réservé à un public majeur
            </p>

            <div className="bg-dark-100 p-4 rounded-lg">
              <p className="font-semibold mb-2">Avertissement</p>
              <p>
                Cette partie du site est un service réservé à un public majeur et averti. 
                Ce service peut contenir des textes et des photos qui peuvent être choquants 
                pour certaines sensibilités.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2">Je certifie sur l'honneur :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>être majeur selon la loi en vigueur dans mon pays de résidence</li>
                <li>être informé du caractère pour adultes de cette partie du site</li>
                <li>que mon pays de résidence m'autorise à consulter ce service</li>
                <li>consulter ce service à titre personnel sans impliquer de quelque manière que ce soit une société privée ou un organisme public</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-2">Je m'engage sur l'honneur à :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>ne pas faire état de l'existence de ce service et à ne pas en diffuser le contenu à des mineurs</li>
                <li>utiliser tous les moyens permettant d'empécher l'accès de ce service à tout mineur</li>
                <li>ne pas poursuivre la société éditrice de toute action judiciaire</li>
                <li>assumer ma responsabilité si un mineur accède à ce service à cause de ma négligence</li>
                <li>assumer ma responsabilité si une ou plusieurs de mes présentes déclarations sont inexactes</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-2">Censure et respect des lois internationales</p>
              <p>
                Toute annonce ne respectant pas les législations internationales sera immédiatement 
                censurée par nos modérateurs. Les services sexuels tarifés sont strictement interdits. 
                Le site FireRoses ne peut en aucun cas être tenu pour responsable du contenu des annonces. 
                En cas de plainte, l'éditeur de FireRoses se réserve le droit de transmettre vos coordonnées 
                numériques et autres éventuelles informations aux autorités compétentes. Pour plus d'informations, 
                nous vous invitons à consulter nos conditions générales d'utilisation.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2">Protection des mineurs et filtre parental</p>
              <p>
                Aux parents soucieux que leur enfant soit facilement confronté à du contenu pornographique 
                sur Internet, nous vous recommandons l'installation de filtres. Faites une recherche sur les 
                termes « contrôle parental » à partir de votre moteur de recherche habituel.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={onAccept}
              className="flex-1 bg-rose text-white py-2.5 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              J'accepte et je certifie être majeur
            </button>
            <button
              onClick={onDecline}
              className="flex-1 bg-dark-100 text-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-dark-200 transition-colors"
            >
              Je refuse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgeVerification;