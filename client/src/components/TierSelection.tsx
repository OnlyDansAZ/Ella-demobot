import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { tiers, comparisonFeatures } from "@/lib/tierData";

const TierSelection: React.FC = () => {
  const [activeTier, setActiveTier] = useState("starter");

  const currentTier = tiers.find((tier) => tier.id === activeTier);

  const handleTierChange = (tierId: string) => {
    setActiveTier(tierId);
  };

  return (
    <section id="tiers" className="py-16 px-4 bg-gray-900">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose Your YoBot</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Select the tier that fits your needs, from basic assistance to fully
            automated workflow management.
          </p>
        </div>

        {/* Tier Selector Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  activeTier === tier.id
                    ? "bg-[#0D82DA] text-white"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
                onClick={() => handleTierChange(tier.id)}
              >
                {tier.name}
              </button>
            ))}
          </div>

          {/* Tier Content Panels */}
          {currentTier && (
            <div className="bg-[#1F2937] rounded-xl overflow-hidden shadow-xl border border-gray-700">
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">{currentTier.name}</h3>
                    <p className="text-gray-400">{currentTier.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#0D82DA] mb-2">
                      {currentTier.price_tier} Plan
                    </div>
                    <a
                      href="#contact"
                      className="inline-block bg-[#0D82DA] hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md transition-colors"
                    >
                      Get Started
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-[#0D82DA]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Features
                    </h4>
                    <ul className="space-y-3">
                      {currentTier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="md:pl-8 md:border-l border-gray-700">
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4">
                        {currentTier.name} Demo
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="bg-[#0D82DA] text-white p-3 rounded-lg rounded-tl-none max-w-md">
                            {currentTier.chat.botMessage}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-gray-700 text-white p-3 rounded-lg rounded-tr-none max-w-md">
                            {currentTier.chat.userMessage}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="bg-[#0D82DA] text-white p-3 rounded-lg rounded-tl-none max-w-md">
                            {currentTier.chat.botResponse}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Comparison Table */}
        <div className="overflow-x-auto mt-12">
          <table className="w-full bg-gray-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-[#0D82DA]/20">
                <th className="px-6 py-4 text-left">Feature</th>
                <th className="px-6 py-4 text-center">Starter</th>
                <th className="px-6 py-4 text-center">Pro</th>
                <th className="px-6 py-4 text-center">Enterprise</th>
                <th className="px-6 py-4 text-center">Platinum</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feature, index) => (
                <tr
                  key={index}
                  className={
                    index < comparisonFeatures.length - 1
                      ? "border-b border-gray-700"
                      : ""
                  }
                >
                  <td className="px-6 py-4">{feature.name}</td>
                  <td className="px-6 py-4 text-center">
                    {typeof feature.starter === "boolean" ? (
                      feature.starter ? (
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      ) : (
                        <X className="h-5 w-5 mx-auto text-gray-500" />
                      )
                    ) : (
                      feature.starter
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {typeof feature.pro === "boolean" ? (
                      feature.pro ? (
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      ) : (
                        <X className="h-5 w-5 mx-auto text-gray-500" />
                      )
                    ) : (
                      feature.pro
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {typeof feature.enterprise === "boolean" ? (
                      feature.enterprise ? (
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      ) : (
                        <X className="h-5 w-5 mx-auto text-gray-500" />
                      )
                    ) : (
                      feature.enterprise
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {typeof feature.platinum === "boolean" ? (
                      feature.platinum ? (
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      ) : (
                        <X className="h-5 w-5 mx-auto text-gray-500" />
                      )
                    ) : (
                      feature.platinum
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default TierSelection;
