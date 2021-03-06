module Actions
  module Katello
    module Host
      module PackageGroup
        class Install < Actions::Katello::AgentAction
          def self.agent_message
            :install_package_group
          end

          def agent_action_type
            :content_install
          end

          def humanized_name
            _("Install package group")
          end

          def humanized_input
            [input[:content].join(", ")] + super
          end

          def finalize
            host = ::Host.find_by(:id => input[:host_id])
            host.update(audit_comment: (_("Installation of package group(s) requested: %{groups}") % {groups: input[:content].join(", ")}).truncate(255))
          end
        end
      end
    end
  end
end
