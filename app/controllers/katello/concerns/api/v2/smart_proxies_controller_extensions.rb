module Katello
  module Concerns
    module Api::V2::SmartProxiesControllerExtensions
      module ApiPieExtensions
        extend ::Apipie::DSL::Concern

        update_api(:create, :update) do
          param :smart_proxy, Hash do
            param :download_policy, String, :required => false, :desc => N_('Download Policy of the capsule, must be one of %s') %
                SmartProxy::DOWNLOAD_POLICIES.join(', ')
          end
        end
      end

      extend ActiveSupport::Concern

      included do
        include ApiPieExtensions

        def create
          @smart_proxy = SmartProxy.new(smart_proxy_params)
          process_response @smart_proxy.save
        end

        def update
          process_response @smart_proxy.update_attributes(smart_proxy_params)
        end
      end
    end
  end
end