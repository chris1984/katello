class RemoveContextFromAvailableModuleStreams < ActiveRecord::Migration[6.1]
  def up
    remove_column :katello_available_module_streams, :context
  end

  def down
    add_column :katello_available_module_streams, :context, :string
  end
end
